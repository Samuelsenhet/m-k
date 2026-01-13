-- Fix RLS performance for all affected tables by using (select auth.uid())
-- personality_scores
DROP POLICY IF EXISTS "Users can view their own scores" ON public.personality_scores;
CREATE POLICY "Users can view their own scores" ON public.personality_scores FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own scores" ON public.personality_scores;
CREATE POLICY "Users can insert their own scores" ON public.personality_scores FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own scores" ON public.personality_scores;
CREATE POLICY "Users can update their own scores" ON public.personality_scores FOR UPDATE USING (user_id = (select auth.uid()));

-- dealbreakers
DROP POLICY IF EXISTS "Users can view their own dealbreakers" ON public.dealbreakers;
CREATE POLICY "Users can view their own dealbreakers" ON public.dealbreakers FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own dealbreakers" ON public.dealbreakers;
CREATE POLICY "Users can insert their own dealbreakers" ON public.dealbreakers FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own dealbreakers" ON public.dealbreakers;
CREATE POLICY "Users can update their own dealbreakers" ON public.dealbreakers FOR UPDATE USING (user_id = (select auth.uid()));

-- matches
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
CREATE POLICY "Users can view their own matches" ON public.matches FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own matches" ON public.matches;
CREATE POLICY "Users can insert their own matches" ON public.matches FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own matches" ON public.matches;
CREATE POLICY "Users can update their own matches" ON public.matches FOR UPDATE USING (user_id = (select auth.uid()));

-- messages
DROP POLICY IF EXISTS "Users can view messages from their matches" ON public.messages;
CREATE POLICY "Users can view messages from their matches" ON public.messages FOR SELECT USING (sender_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert messages to their matches" ON public.messages;
CREATE POLICY "Users can insert messages to their matches" ON public.messages FOR INSERT WITH CHECK (sender_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update messages in their matches" ON public.messages;
CREATE POLICY "Users can update messages in their matches" ON public.messages FOR UPDATE USING (sender_id = (select auth.uid()));

-- achievements
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.achievements;
CREATE POLICY "Users can view their own achievements" ON public.achievements FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.achievements;
CREATE POLICY "Users can insert their own achievements" ON public.achievements FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own achievements" ON public.achievements;
CREATE POLICY "Users can update their own achievements" ON public.achievements FOR UPDATE USING (user_id = (select auth.uid()));

-- subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert their own subscription" ON public.subscriptions FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
CREATE POLICY "Users can update their own subscription" ON public.subscriptions FOR UPDATE USING (user_id = (select auth.uid()));

-- notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
CREATE POLICY "Users can insert their own notifications" ON public.notifications FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = (select auth.uid()));

-- push_subscriptions
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions FOR ALL USING (user_id = (select auth.uid()));

-- user_daily_match_pools
DROP POLICY IF EXISTS "Users can view their own pools" ON public.user_daily_match_pools;
CREATE POLICY "Users can view their own pools" ON public.user_daily_match_pools FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own pools" ON public.user_daily_match_pools;
CREATE POLICY "Users can insert their own pools" ON public.user_daily_match_pools FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own pools" ON public.user_daily_match_pools;
CREATE POLICY "Users can update their own pools" ON public.user_daily_match_pools FOR UPDATE USING (user_id = (select auth.uid()));

-- user_match_delivery_status
DROP POLICY IF EXISTS "Users can view their own delivery status" ON public.user_match_delivery_status;
CREATE POLICY "Users can view their own delivery status" ON public.user_match_delivery_status FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own delivery status" ON public.user_match_delivery_status;
CREATE POLICY "Users can insert their own delivery status" ON public.user_match_delivery_status FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own delivery status" ON public.user_match_delivery_status;
CREATE POLICY "Users can update their own delivery status" ON public.user_match_delivery_status FOR UPDATE USING (user_id = (select auth.uid()));

-- consents
DROP POLICY IF EXISTS "Users can view their own consents" ON public.consents;
CREATE POLICY "Users can view their own consents" ON public.consents FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own consents" ON public.consents;
CREATE POLICY "Users can insert their own consents" ON public.consents FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own consents" ON public.consents;
CREATE POLICY "Users can update their own consents" ON public.consents FOR UPDATE USING (user_id = (select auth.uid()));

-- privacy_settings
DROP POLICY IF EXISTS "Users can view their own privacy settings" ON public.privacy_settings;
CREATE POLICY "Users can view their own privacy settings" ON public.privacy_settings FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own privacy settings" ON public.privacy_settings;
CREATE POLICY "Users can insert their own privacy settings" ON public.privacy_settings FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own privacy settings" ON public.privacy_settings;
CREATE POLICY "Users can update their own privacy settings" ON public.privacy_settings FOR UPDATE USING (user_id = (select auth.uid()));
