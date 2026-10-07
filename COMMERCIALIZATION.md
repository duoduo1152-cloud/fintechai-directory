# FintechAI Directory — 14-Day Revenue Sprint

## Revenue objective

Close the first attributable commercial transaction without compromising editorial independence.

Primary offer: **Featured Listing — $99 for 30 days**.

Upsell: **Buyer Guide Sponsor — $299 per guide**.

## Daily operating funnel

1. Identify five relevant vendors already listed in a high-intent guide.
2. Find a partnerships, growth or founder contact from the vendor's official site.
3. Send a short, personalized inquiry.
4. Record the outreach, reply and next action in the pipeline.
5. Activate paid placement only after payment and disclosure details are confirmed.
6. Add the partner to `data/partners.json`, rebuild and verify click tracking.

## Priority segments

1. Financial advisor workflow tools
2. FP&A platforms
3. Investment research tools with self-serve pricing
4. Tax and accounting automation tools
5. Fintech compliance products targeting startups

## Initial outreach email

Subject: Featured placement for {{company}} on FintechAI Directory

Hi {{first_name}},

We include {{company}} in FintechAI Directory, a focused directory for finance teams comparing AI products.

We are opening a small founding-partner cohort. The introductory offer is $99 for 30 days and includes a clearly labeled featured placement in the relevant category, tracked outbound clicks and a simple campaign summary.

Your editorial profile remains independent; sponsorship changes visibility, not our verdict.

Would you like me to send the proposed placement for {{company}}?

Best,
FintechAI Directory
hello@fintechai.directory

## Follow-up after three business days

Subject: Re: Featured placement for {{company}}

Hi {{first_name}},

Following up in case a finance-specific directory placement is relevant to your current growth plans. I can send the exact page, placement and tracking setup before you decide.

The founding rate is $99 for 30 days, with no renewal commitment.

Best,
FintechAI Directory

## Partner configuration

Add an entry to `data/partners.json` only after the relationship is confirmed:

```json
{
  "tool-slug": {
    "status": "active",
    "relationship": "affiliate",
    "destination_url": "https://vendor.example/referral-url",
    "featured": true,
    "label": "Sponsored"
  }
}
```

Allowed `relationship` values:

- `organic`
- `affiliate`
- `sponsored`

## Weekly metrics

- Vendor inquiries sent
- Positive reply rate
- Partnership calls or qualified conversations
- Paid placements closed
- Revenue collected
- Sponsored impressions
- Sponsored outbound clicks
- Newsletter signups from commercial landing pages

Do not count an inquiry, verbal interest or invoice as revenue. Record revenue only after payment is received.
