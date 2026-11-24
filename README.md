# The World — Monday 23 November 2026

[![News image](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/c/news-image-20261123)
[![Rank](https://make.fun/badge/news-image-20261123/farcasteralpha/makefun-news-image-20261123/rank.svg)](https://make.fun/c/news-image-20261123)
[![Reward](https://make.fun/badge/news-image-20261123/farcasteralpha/makefun-news-image-20261123/reward.svg)](https://make.fun/c/news-image-20261123)

An entry for the [make.fun competition "Sum up 23 November's world news in one image"](https://make.fun/c/news-image-20261123): a program that writes one newspaper front page covering Monday 23 November 2026 to `/output/entry.png`.

## What the picture shows

A front page headed **MONDAY 23 NOVEMBER 2026**, with six stories reported on the day:

- **COP31, Antalya** — climate talks collapse with no deal: the EU and UK reject the Antalya Pact after its final text drops any mention of phasing out fossil fuels. The longest COP ever, and the first breakdown since COP15 in 2009.
- **Kyiv region, Ukraine** — Russian strikes kill at least 6; a boy, 7, is pulled alive from the rubble.
- **Poland** — three objects that fell on 20 November are confirmed as Russian cruise missiles; NATO to meet.
- **USA** — Democrats take a record House majority, at least 258 seats, the largest since 1992.
- **Benghazi, Libya** — a suspected drone attack causes an explosion on a Russian ship at the naval base.
- **Markets** — stocks plunge after Friday's US sell-off; Taiwan shares down 17.5% in a week.

A footer ticker adds: FIFA to name the UK as host of the 2035 Women's World Cup, Alcaraz wins the ATP Finals, and a magnitude 6.5 quake shakes Vanuatu.

## How it works

`main.ts` (Node 22, standard library only) draws the front page pixel by pixel — a 5x7 bitmap font, flat pictograms for each story, and a hand-rolled PNG encoder. No network, no copied images. Run it twice and the bytes are identical.

Run it with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.
