# The WhatsApp automation offer

Researched 2026-07-31, before building anything, as instructed.

## The economics work

Meta switched WhatsApp Cloud API to **per-message pricing on 1 July 2025**, and the important
part for us: **service conversations are free**. When a customer messages the business first,
everything the business sends back inside that open window costs nothing.

A booking conversation is exactly that shape: the customer opens it. So the bot that takes the
booking is **free to run**.

You only pay for **template messages** sent outside the window, which is the proactive
day-before reminder. Israel has its own rate card. So at 100/month per shop, the reminder is the
only real cost and everything else is margin.

## The blocker nobody mentions

**A phone number registered to the Cloud API cannot be used with regular WhatsApp.** If a barber
migrates his shop number, he loses the WhatsApp app on it and his message history goes with it.

No barber will agree to that. His number is his business and half his personal life.

**The way around it is a Solution Partner.** Meta's own docs: onboard through a solution provider
that supports Business-app onboarding and "you will be able to use both the WhatsApp Business app
and the solution partner's app concurrently, and your messaging history will be preserved."

So the offer is real, but it has to go through a BSP, not the naive do-it-yourself Cloud API
route. BSPs charge, and that cost has to sit inside the 100 before it is quoted to anyone.
**Do not promise WhatsApp automation to a shop until a specific BSP and its price is picked.**

## You cannot pre-check who already has automation

The qualifying question — does this shop already automate WhatsApp — can only be answered by
messaging them. Messaging two hundred businesses to find out is precisely the bulk-messaging
pattern that got the account restricted on 31 July.

What can be seen without messaging anyone:

- has a website, or only a directory listing
- has an online booking link on Google Maps
- rating, review count, how recent the reviews are

Qualify on those. Find out about automation inside a conversation the shop chose to have.

**Also: an auto-reply is not automation.** Both shops contacted so far, RICO and Lior, already
send a canned "thanks for contacting us" reply. That is a WhatsApp Business away-message, not
booking automation, and it is common. Counting it as "they already have a system" would wrongly
disqualify most of the market. The gap worth selling into is real booking, not a greeting.

## What to sell, in order

1. **The website.** Cheap to deliver, nothing to migrate, no dependency on Meta. This is the
   opener and it is what is already built.
2. **Calendar sync.** Bookings land in his Google Calendar. Also free to run.
3. **WhatsApp automation.** Only after a BSP is chosen and priced, and only for a shop that
   understands what happens to its number.

Selling 3 before 1 means a long technical setup with a stranger who has not paid yet.
