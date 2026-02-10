#!/usr/bin/env node
/**
 * Loopia DNS via API – säkert med miljövariabler
 *
 * Kräver: LOOPIA_API_USER, LOOPIA_API_PASSWORD (sätt i .env eller export)
 * Skapa API-användare: Loopia Kundzon → Kontoinställningar → LoopiaAPI
 *
 * Användning:
 *   node scripts/loopia-dns.js list                    # lista records för maakapp.se
 *   node scripts/loopia-dns.js set-vercel              # sätt A @ + CNAME www för Vercel
 *
 * .env läses automatiskt om dotenv finns; annars använd export eller --env-file.
 */

const LOOPIA_RPC = 'https://api.loopia.se/RPCSERV';
const DOMAIN = 'maakapp.se';

// Vercel (uppdatera om Vercel visar nya värden under Settings → Domains)
const VERCEL_A_VALUE = '216.198.79.1';
const VERCEL_CNAME_VALUE = '60a1859842c4f661.vercel-dns-017.com.'; // projektspecifikt – kolla i Vercel
const TTL = 3600;

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function xmlRpcCall(methodName, params) {
  const paramsXml = params
    .map((p) => {
      if (typeof p === 'string') {
        return `<param><value><string>${escapeXml(p)}</string></value></param>`;
      }
      if (typeof p === 'number') {
        return `<param><value><int>${p}</int></value></param>`;
      }
      if (p && typeof p === 'object' && p.__struct) {
        const members = p.members
          .map(
            (m) =>
              `<member><name>${escapeXml(m.name)}</name><value>${m.value}</value></member>`
          )
          .join('');
        return `<param><value><struct>${members}</struct></value></param>`;
      }
      return '';
    })
    .join('');
  const body = `<?xml version="1.0"?><methodCall><methodName>${methodName}</methodName><params>${paramsXml}</params></methodCall>`;
  return fetch(LOOPIA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body,
  }).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  });
}

function parseXmlRpcResponse(xml) {
  const match = xml.match(/<name>faultCode<\/name>\s*<value><int>(\d+)<\/int>/);
  if (match) {
    const msg = xml.match(/<name>faultString<\/name>\s*<value><string>([^<]*)<\/string>/);
    throw new Error(`Loopia API fault: ${match[1]} ${msg ? msg[1] : ''}`);
  }
  return xml;
}

function getZoneRecords(username, password, domain, subdomain) {
  return xmlRpcCall('getZoneRecords', [username, password, domain, subdomain])
    .then(parseXmlRpcResponse)
    .then((xml) => {
      const records = [];
      const re = /<member>\s*<name>record_id<\/name>\s*<value><int>(\d+)<\/int><\/value>\s*<\/member>\s*<member>\s*<name>type<\/name>\s*<value><string>([^<]*)<\/string><\/value>\s*<\/member>\s*<member>\s*<name>rdata<\/name>\s*<value><string>([^<]*)<\/string><\/value>/g;
      let m;
      while ((m = re.exec(xml)) !== null) {
        records.push({ record_id: parseInt(m[1], 10), type: m[2], rdata: m[3] });
      }
      return records;
    });
}

function addZoneRecord(username, password, domain, subdomain, recordObj) {
  const members = [
    { name: 'type', value: `<string>${escapeXml(recordObj.type)}</string>` },
    { name: 'rdata', value: `<string>${escapeXml(recordObj.rdata)}</string>` },
    { name: 'ttl', value: `<int>${recordObj.ttl ?? TTL}</int>` },
    { name: 'priority', value: `<int>${recordObj.priority ?? 0}</int>` },
  ];
  return xmlRpcCall('addZoneRecord', [
    username,
    password,
    domain,
    subdomain,
    { __struct: true, members },
  ]).then(parseXmlRpcResponse);
}

async function loadEnv() {
  try {
    const { config } = await import('dotenv');
    config(); // .env i projektets root
  } catch {
    // dotenv inte installerat – använd endast process.env
  }
}

async function main() {
  await loadEnv();
  const user = process.env.LOOPIA_API_USER;
  const pass = process.env.LOOPIA_API_PASSWORD;
  if (!user || !pass) {
    console.error(
      'Sätt LOOPIA_API_USER och LOOPIA_API_PASSWORD (t.ex. i .env). Se .env.example.'
    );
    process.exit(1);
  }

  const cmd = process.argv[2] || 'list';

  if (cmd === 'list') {
    for (const sub of ['', 'www']) {
      const label = sub || '@';
      console.log(`\n--- ${DOMAIN} (${label}) ---`);
      try {
        const records = await getZoneRecords(user, pass, DOMAIN, sub);
        if (records.length === 0) {
          console.log('  (inga records)');
        } else {
          records.forEach((r) => console.log(`  ${r.type} ${r.rdata} (id ${r.record_id})`));
        }
      } catch (e) {
        console.log('  Fel:', e.message);
      }
    }
    return;
  }

  if (cmd === 'set-vercel') {
    // Root A
    try {
      await addZoneRecord(user, pass, DOMAIN, '', {
        type: 'A',
        rdata: VERCEL_A_VALUE,
        ttl: TTL,
      });
      console.log(`A @ ${VERCEL_A_VALUE} tillagt.`);
    } catch (e) {
      if (e.message.includes('DUPLICATE') || e.message.includes('exists')) {
        console.log('A @ finns redan.');
      } else throw e;
    }
    // www CNAME
    try {
      await addZoneRecord(user, pass, DOMAIN, 'www', {
        type: 'CNAME',
        rdata: VERCEL_CNAME_VALUE,
        ttl: TTL,
      });
      console.log(`CNAME www ${VERCEL_CNAME_VALUE} tillagt.`);
    } catch (e) {
      if (e.message.includes('DUPLICATE') || e.message.includes('exists')) {
        console.log('CNAME www finns redan.');
      } else throw e;
    }
    console.log('Klar. Uppdatera CNAME-värdet i scriptet om Vercel visar ett annat.');
    return;
  }

  console.log('Användning: node scripts/loopia-dns.js list | set-vercel');
  process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
