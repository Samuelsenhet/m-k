-- Samlingar (Collections) – datamodell enligt agent-redo spec
-- Tabeller: collections, collection_members, collection_messages
-- RLS: skapare (owner) vs medlemmar, soft leave (left_at), redo för realtime/AI

-- ============================================
-- 1. collections (Samlingar)
-- ============================================
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_seed TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_collections_created_by ON public.collections(created_by);
CREATE INDEX IF NOT EXISTS idx_collections_is_active ON public.collections(is_active) WHERE is_active = true;

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Endast inloggad användare kan skapa (blir owner via collection_members)
CREATE POLICY "Authenticated users can create collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Endast medlemmar (inkl. owner) kan se samlingen
CREATE POLICY "Members can view collection"
  ON public.collections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collection_members cm
      WHERE cm.collection_id = collections.id
        AND cm.user_id = auth.uid()
        AND cm.left_at IS NULL
    )
  );

-- Endast owner kan uppdatera/radera samlingen
CREATE POLICY "Owner can update collection"
  ON public.collections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.collection_members
      WHERE collection_id = collections.id
        AND user_id = auth.uid()
        AND role = 'owner'
        AND left_at IS NULL
    )
  );

CREATE POLICY "Owner can delete collection"
  ON public.collections FOR DELETE
  USING (created_by = auth.uid());

-- ============================================
-- 2. collection_members (Medlemmar)
-- ============================================
CREATE TABLE IF NOT EXISTS public.collection_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ
);

-- En användare kan bara ha en aktiv medlemskap per samling (left_at IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_collection_members_active
  ON public.collection_members(collection_id, user_id)
  WHERE left_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_collection_members_collection_id ON public.collection_members(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_members_user_id ON public.collection_members(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_members_left_at ON public.collection_members(collection_id, left_at) WHERE left_at IS NULL;

ALTER TABLE public.collection_members ENABLE ROW LEVEL SECURITY;

-- Medlemmar kan se andra medlemmar i samma samling (inkl. de som lämnat, för historik)
CREATE POLICY "Members can view collection_members"
  ON public.collection_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collection_members cm2
      WHERE cm2.collection_id = collection_members.collection_id
        AND cm2.user_id = auth.uid()
        AND cm2.left_at IS NULL
    )
  );

-- Endast owner kan lägga till medlemmar; användare kan lägga till sig själv vid skapande (owner)
CREATE POLICY "Owner can insert members or self as owner"
  ON public.collection_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.collection_members cm
      WHERE cm.collection_id = collection_members.collection_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'owner'
        AND cm.left_at IS NULL
    )
  );

-- Owner kan uppdatera medlemskap (t.ex. role); medlem kan uppdatera sitt eget (t.ex. left_at vid leave)
CREATE POLICY "Owner or self can update collection_members"
  ON public.collection_members FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.collection_members cm
      WHERE cm.collection_id = collection_members.collection_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'owner'
        AND cm.left_at IS NULL
    )
  );

-- Owner kan ta bort medlemmar; medlem kan ta bort sig själv (hard delete om ni vill – annars använd left_at)
CREATE POLICY "Owner or self can delete collection_members"
  ON public.collection_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.collection_members cm
      WHERE cm.collection_id = collection_members.collection_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'owner'
        AND cm.left_at IS NULL
    )
  );

-- ============================================
-- 3. collection_messages (Meddelanden)
-- ============================================
CREATE TABLE IF NOT EXISTS public.collection_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'system', 'ai')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collection_messages_collection_id ON public.collection_messages(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_messages_created_at ON public.collection_messages(collection_id, created_at DESC);

ALTER TABLE public.collection_messages ENABLE ROW LEVEL SECURITY;

-- Endast medlemmar (aktivt, left_at IS NULL) kan läsa meddelanden
CREATE POLICY "Members can view collection_messages"
  ON public.collection_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collection_members
      WHERE collection_id = collection_messages.collection_id
        AND user_id = auth.uid()
        AND left_at IS NULL
    )
  );

-- Medlemmar kan skicka text; system/ai skapas via service role eller Edge Function
CREATE POLICY "Members can insert text messages"
  ON public.collection_messages FOR INSERT
  WITH CHECK (
    type = 'text'
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.collection_members
      WHERE collection_id = collection_messages.collection_id
        AND user_id = auth.uid()
        AND left_at IS NULL
    )
  );

-- Sender kan uppdatera eget textmeddelande (redigering)
CREATE POLICY "Sender can update own message"
  ON public.collection_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- System- och ai-meddelanden (sender_id NULL) skapas från Edge Function med service role
-- (RLS bypass). Klienten får endast skicka type = 'text' med eget sender_id.
