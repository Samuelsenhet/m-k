import { Link, type Href } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { openExternalUrl } from '@/lib/openExternalUrl';

export function ExternalLink(
  props: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: Href | string },
) {
  const href = props.href as Href;
  return (
    <Link
      target="_blank"
      {...props}
      href={href}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          e.preventDefault();
          void openExternalUrl(String(props.href));
        }
      }}
    />
  );
}
