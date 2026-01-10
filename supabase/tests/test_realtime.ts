/// <reference types="vite/client" />

/**
 * Realtime Functionality Test
 * Tests that Supabase Realtime works for messages and notifications
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test 1: Subscribe to messages for a specific match
export async function testMessagesRealtime(matchId: string) {
  console.log('🧪 TEST: Messages Realtime')
  console.log(`Subscribing to messages for match: ${matchId}`)
  
  const channel = supabase
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      },
      (payload) => {
        console.log('✅ New message received:', payload.new)
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status)
    })

  // Send a test message after 2 seconds
  setTimeout(async () => {
    try {
      console.log('📤 Sending test message...')
      
      const userResult = await supabase.auth.getUser()
      if (!userResult.data.user) {
        const errorMsg = '❌ No authenticated user - cannot send test message'
        console.error(errorMsg)
        throw new Error(errorMsg)
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: userResult.data.user.id,
          content: 'Test message for realtime'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error sending message:', error)
        throw error
      } else {
        console.log('✅ Message sent:', data)
      }
    } catch (err) {
      console.error('❌ Async error in test message send:', err)
      throw err
    }
  }, 2000)

  // Cleanup after 10 seconds
  setTimeout(() => {
    console.log('🧹 Cleaning up subscription')
    supabase.removeChannel(channel)
  }, 10000)
}

// Test 2: Subscribe to notifications for current user
export async function testNotificationsRealtime() {
  console.log('🧪 TEST: Notifications Realtime')
  
  const user = await supabase.auth.getUser()
  if (!user.data.user) {
    console.error('❌ No authenticated user')
    return
  }

  console.log(`Subscribing to notifications for user: ${user.data.user.id}`)
  
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.data.user.id}`
      },
      (payload) => {
        console.log('✅ New notification received:', payload.new)
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status)
    })

  // Create a test notification after 2 seconds
  setTimeout(async () => {
    console.log('📤 Creating test notification...')
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.data.user!.id,
        title: 'Test Notification',
        body: 'This is a test notification for realtime',
        type: 'test',
        read: false
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating notification:', error)
    } else {
      console.log('✅ Notification created:', data)
    }
  }, 2000)

  // Cleanup after 10 seconds
  setTimeout(() => {
    console.log('🧹 Cleaning up subscription')
    supabase.removeChannel(channel)
  }, 10000)
}

// Test 3: Subscribe to match status changes
export async function testMatchesRealtime() {
  console.log('🧪 TEST: Matches Realtime')
  
  const user = await supabase.auth.getUser()
  if (!user.data.user) {
    console.error('❌ No authenticated user')
    return
  }

  console.log(`Subscribing to matches for user: ${user.data.user.id}`)
  
  const channel = supabase
    .channel('matches')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `user_id=eq.${user.data.user.id}`
      },
      (payload) => {
        console.log('✅ Match update received:', payload)
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status)
    })

  // Cleanup after 10 seconds
  setTimeout(() => {
    console.log('🧹 Cleaning up subscription')
    supabase.removeChannel(channel)
  }, 10000)
}

// Test 4: Subscribe to presence (online status)
export async function testPresenceRealtime() {
  console.log('🧪 TEST: Presence Realtime')
  
  const user = await supabase.auth.getUser()
  if (!user.data.user) {
    console.error('❌ No authenticated user')
    return
  }

  const channel = supabase.channel('online-users', {
    config: {
      presence: {
        key: user.data.user.id,
      },
    },
  })

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      console.log('✅ Presence state:', state)
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('✅ User joined:', key, newPresences)
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('✅ User left:', key, leftPresences)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const trackResult = await channel.track({
          online_at: new Date().toISOString(),
        })
        console.log('Tracking status:', trackResult)
      }
    })

  // Cleanup after 10 seconds
  setTimeout(() => {
    console.log('🧹 Cleaning up presence')
    channel.untrack()
    supabase.removeChannel(channel)
  }, 10000)
}

// Run all tests
export async function runAllRealtimeTests() {
  console.log('🚀 Starting Realtime Tests...\n')
  
  // You'll need to provide a valid match ID for message testing
  // const matchId = 'your-match-id-here'
  // await testMessagesRealtime(matchId)
  
  await testNotificationsRealtime()
  await testMatchesRealtime()
  await testPresenceRealtime()
  
  console.log('\n✅ All tests initiated. Watch console for results.')
}

// Uncomment to run tests
// runAllRealtimeTests()
