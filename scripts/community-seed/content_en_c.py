# -*- coding: utf-8 -*-
# English community seed content (set C).
# Comments: plain string = top-level comment, "r:" = someone else's reply to the latest top-level comment,
# "a:" = post author's reply to the latest top-level comment.

LOCALE = "en"

POSTS = [
# ───────────── free ─────────────
dict(type="free", title="the group chat went real quiet this week", body=[
 "two months ago it was rocket emojis every 10 min. now nobody has posted a screenshot in 9 days",
 "funny how that works"],
 comments=["silence is the loudest indicator", "r:lmao this should be on a chart", "ours turned into a fantasy football chat overnight", "a:honestly an upgrade"]),
dict(type="free", title="Explained compound interest to my 12 year old nephew", body=[
 "Used a jar of coins and a spreadsheet. Every 'year' we added 7% of whatever was in the jar.",
 "He got bored around year 5. Then around year 25 he went quiet and said 'wait, it's doing it by itself?'",
 "Yeah buddy. That's the whole trick.",
 "He now wants to put his birthday money in 'the jar'. Parents are on board, so a custodial account it is."],
 comments=["this is genuinely wholesome", "wish someone had done this for me at 12 instead of 32", "a:same, that's kinda why i did it", "the 'it's doing it by itself' moment is the best moment", "r:it never stops being magic tbh", "steal this for my kids, thanks"]),
dict(type="free", title="my bank app keeps sending 'markets are moving!' push notifications", body=[
 "like yes. that is what markets do. every day. turned them off"],
 comments=["they want you to trade, trading = fees", "r:exactly, nothing in that app is designed for your benefit", "mine sends 'your stock is down 3%' at 7am. thanks i hate it"]),
dict(type="free", title="lunch break trading is ruining my lunch", body=[
 "i eat a sandwich in 4 minutes while staring at a 5 min chart",
 "then spend the afternoon annoyed at a trade i didnt need to make",
 "going back to eating outside like a normal person"],
 comments=["touch grass (literally) during lunch, best decision", "the 5 min chart is a lie generator", "a:ngl it's been 2 days and my afternoons are better", "i used to do the same in the bathroom at work lol", "r:we all have", "r:the bathroom trades were always the worst ones"]),
dict(type="free", title="Sold most of my portfolio for a house deposit. Weird feeling.", body=[
 "Spent 6 years building it up. Last month I sold about 80% for the deposit on a small flat.",
 "Logically this was always the plan — the money was earmarked for this. But watching the number drop to almost nothing felt like losing something.",
 "Now it's a mortgage and a much smaller account starting from scratch-ish.",
 "Anyone else been through this? How long until it stopped feeling like a reset?"],
 comments=["congrats on the house first of all", "it's not gone, it just moved into bricks", "r:this. your net worth didn't drop, it changed form", "a:that's a good way to frame it, thank you", "Did the same 3 years ago. The new account felt tiny for about a year, then it starts to feel like a project again", "best use of investment money imo. you did the thing it was for", "watch out for the urge to 'catch up' fast with risky stuff. that got me"]),
dict(type="free", title="do you guys name your wallets", body=[
 "mine are 'boring', 'less boring' and 'never look at this one'"],
 comments=["'retirement', 'fun money', and 'regret'", "r:regret is a very honest wallet name", "mine are just numbered. i'm no fun", "'do not touch' is mine. i touch it constantly"]),
dict(type="free", title="Moved from the US to the Netherlands and my portfolio is now a puzzle", body=[
 "Didn't think about taxes at all before moving. Big mistake.",
 "Now I have a US brokerage that's annoyed I live abroad, US ETFs that EU brokers won't let me buy more of, and a wealth tax system that works completely differently from what I'm used to.",
 "<b>Lesson:</b> if you're planning to move countries, talk to a cross-border tax person BEFORE you go, not after.",
 "Slowly sorting it out. Not fun."],
 comments=["the US citizen abroad situation is uniquely painful", "r:yep, PFIC rules make EU funds a nightmare for Americans", "a:that's exactly the trap i'm in. can't really buy US funds here, shouldn't buy EU ones", "a cross-border advisor saved me from a very expensive mistake once. worth paying for", "good PSA, nobody talks about this part of moving"]),
dict(type="free", title="coworker keeps asking me for 'a tip'", body=[
 "i told him i buy a global index fund every month. he looked so disappointed",
 "he wanted a coin name i think"],
 comments=["that IS the tip though", "r:best tip nobody wants", "give him the name of a fund and watch his eyes glaze over", "a:did exactly that. he said 'nah something that'll actually move'", "r:he'll learn eventually lol"]),
dict(type="free", title="unpopular opinion: green weeks are more dangerous than red ones", body=[
 "red weeks make me cautious. green weeks make me think i'm smart",
 "and thinking i'm smart is where every bad decision i've made started"],
 comments=["not unpopular here at all", "overconfidence is the real leverage", "r:stealing this", "a:lol it's yours", "every blowup story i've read starts with 'i'd been on a hot streak'"]),

# ───────────── question ─────────────
dict(type="question", title="limit order vs market order — when does it actually matter?", body=[
 "i always just hit market buy. someone said that's costing me money. is it?"],
 comments=["for big liquid stuff like large ETFs during market hours the difference is tiny", "for small coins or low volume stocks it can matter a LOT. spreads are wide", "r:this. market orders on illiquid altcoins can fill way worse than the price you saw", "a:ah ok, that explains a weird fill i got last month", "rule of thumb: limit orders for anything that isn't super liquid, and never market order at the open", "r:the open is chaos, agreed"]),
dict(type="question", title="Accumulating vs distributing ETFs — which do you pick?", body=[
 "EU investor here. Same fund comes in Acc and Dist versions. I don't need the income right now.",
 "Is Acc just obviously better, or does tax in my country change the answer?"],
 comments=["depends heavily on your country's tax rules. in some places acc is taxed anyway on a 'deemed' basis", "r:yeah check the local rules before deciding, it's not universal", "if you're not living off dividends, acc saves you the hassle of reinvesting manually", "a:that's the main appeal for me tbh, i'm lazy", "I hold dist just because seeing the dividends land keeps me motivated. irrational but works"]),
dict(type="question", title="is staking worth it or just extra risk?", body=[
 "holding some ETH and SOL on an exchange. they offer staking with a yield. sounds free",
 "what's the catch"],
 comments=["catch #1: lockups. you might not be able to sell when you want", "catch #2: if it's on an exchange you're trusting the exchange with your coins even more", "r:and some exchanges take a big cut of the rewards", "the yield is paid in the coin, so if the coin drops 30% your 4% doesn't help much", "a:ok so it's more like 'bonus if you were going to hold anyway'", "r:exactly that", "also check how it's taxed where you live, can be messy"]),
dict(type="question", title="Exchange asked me to redo KYC — normal or scam?", body=[
 "Got an email saying my account needs 'enhanced verification' with a link. Is this legit?"],
 comments=["DON'T click the link. log in directly through the app or by typing the url yourself", "r:if it's real, it'll show up in your account notifications", "exchanges do re-verify sometimes, but the email-with-link version is the #1 phishing format", "a:logged in directly, no notification. so it was fake. reported it", "r:good call"]),
dict(type="question", title="how many stocks is too many?", body=[
 "i own 34 individual stocks. some are like $50 positions. is this dumb"],
 comments=["at 34 you basically own a worse index fund lol", "r:with more effort and more tax events", "if you can't track all of them, it's too many. for me that's about 10", "a:i definitely cannot name all 34 without opening the app", "r:there's your answer", "consolidate the tiny ones and put the rest in an index, much less mental load"]),
dict(type="question", title="What do you do with cash sitting in your brokerage?", body=[
 "I keep some cash for buying dips. It just sits there earning nothing. Is there a sensible place to park it?"],
 comments=["money market fund inside the brokerage. check what yours offers", "some brokers pay interest on cash, some pay basically zero. worth checking", "r:the difference between brokers on this is huge and nobody looks", "honestly 'cash for buying dips' tends to sit forever. I just invest it now", "a:guilty. it's been sitting for 8 months waiting for a dip"]),
dict(type="question", title="dumb idea to keep my emergency fund in a stablecoin?", body=[
 "some platforms offer yield on stablecoins higher than my savings account. tempting"],
 comments=["emergency fund should be boring and insured. stablecoins are neither", "r:the yield exists because there's risk somewhere", "depegs, platform freezes, withdrawal limits... exactly the stuff you don't want during an emergency", "a:yeah ok when you put it that way. keeping it in the bank", "fine for 'extra' cash maybe, never for the emergency fund"]),
dict(type="question", title="How do you deal with FX fees buying US stocks from Europe?", body=[
 "My broker charges a currency conversion fee every time I buy a US stock. It adds up.",
 "Do people hold a USD balance? Buy EU-listed versions? Just accept it?"],
 comments=["for ETFs, buy the UCITS version listed in EUR. no conversion needed", "some brokers let you hold a USD balance so you only convert once in bulk", "r:this, convert a big chunk at once instead of every small buy", "check the fee carefully, some 'free' brokers hide it in the FX spread", "a:just checked, mine is in the spread. sneaky", "r:it's always in the spread"]),

# ───────────── analysis ─────────────
dict(type="analysis", title="Altcoin liquidity is thinner than the market cap suggests", body=[
 "Something I didn't understand for a long time: market cap tells you almost nothing about how easy it is to get in or out.",
 "What actually matters is <b>order book depth</b> — how much you can buy or sell before the price moves 1-2%.",
 "Some coins with big market caps have surprisingly little depth. A modest sell can push the price down hard, and the same goes on the way up.",
 "What I check now before buying anything outside the top names:",
 "1. Depth within ±2% on the main exchanges (many exchanges show this)",
 "2. How much of the volume is on one exchange only",
 "3. Whether the spread widens a lot on weekends",
 "4. Circulating supply vs total supply — a lot of 'market cap' is tokens that haven't hit the market",
 "None of this tells you where price goes. It tells you how painful it'll be if you're wrong."],
 comments=["this is underrated. market cap is basically price x a number that's often misleading", "point 4 especially. FDV vs circulating has burned me", "r:same. 'low cap gem' with 80% of tokens still locked", "a:yep, the unlock schedule is part of the depth story imo", "good post. weekend spreads on small coins are wild", "r:weekend + small coin + market order = pain", "saving this"]),
dict(type="analysis", title="Why I stopped using RSI by itself", body=[
 "used to buy every time RSI went under 30. it 'worked' in ranging markets",
 "then a real downtrend came and RSI sat under 30 for weeks while price kept falling",
 "now i only look at it alongside the bigger trend. oversold in an uptrend = interesting. oversold in a downtrend = normal"],
 comments=["oversold can stay oversold longer than you can stay solvent", "r:classic", "divergences were more useful for me than the raw level, but still not reliable alone", "a:yeah i look at divergences too now, but small sizing", "any single indicator alone is a coin flip with extra steps"]),
dict(type="analysis", title="anyone tracking BTC vs nasdaq correlation lately?", body=[
 "feels like some weeks they move in lockstep and other weeks completely unrelated",
 "does it actually tell you anything useful"],
 comments=["correlation tends to go up during macro stress, everything sells together", "r:in a real panic everything correlates to 1", "it's not stable enough to trade on imo. more useful as context", "a:that's kind of what i figured, thanks"]),
dict(type="analysis", title="Where does DeFi yield actually come from?", body=[
 "If something pays 15%, I now ask: who is paying it, and why?",
 "Roughly the buckets I've found:",
 "- <b>Trading fees</b> (providing liquidity) — real, but you eat impermanent loss",
 "- <b>Borrowing demand</b> (lending) — real, rises when people want leverage",
 "- <b>Token emissions</b> — the protocol printing its own token to pay you. This is the one that fades.",
 "- <b>Staking rewards</b> — network issuance, which is also partly dilution",
 "If most of the yield is emissions, it's marketing budget, not income. When the emissions stop, the yield stops.",
 "Not saying avoid it, just know which bucket you're in."],
 comments=["'if you don't know where the yield comes from, you are the yield'", "r:the classic", "emissions-based yield is the most common trap I see", "a:yep, and the token being emitted usually trends down because everyone farms and dumps", "good breakdown. impermanent loss is still confusing to me", "r:simplest version: if prices of the two tokens diverge a lot, you'd have been better off just holding", "smart contract risk deserves its own bucket too"]),
dict(type="analysis", title="exchange reserves dropping — does it mean anything?", body=[
 "see charts saying BTC on exchanges is falling. people say bullish because less to sell",
 "but couldn't it just be ETFs and custodians holding it elsewhere"],
 comments=["yeah the data got messier since a lot moved to custodians. not as clean a signal as it used to be", "slow trend over months maybe means something. day to day it's noise", "a:makes sense. i'll treat it as background info"]),
dict(type="analysis", title="My checklist before buying any new token", body=[
 "Wrote this after getting burned twice. Not financial advice, just my filter.",
 "<b>1. What does it actually do?</b> If I can't explain it to a friend in two sentences, pass.",
 "<b>2. Who holds the supply?</b> Check top wallets. If a few wallets own most of it, pass.",
 "<b>3. Unlock schedule.</b> Big unlocks coming = extra supply coming.",
 "<b>4. Where is it listed?</b> One small exchange only = liquidity risk.",
 "<b>5. Is there revenue or real usage?</b> Or just a roadmap.",
 "<b>6. Why is it in front of me?</b> If I found it from a paid promo or a stranger in my DMs, that's an answer by itself.",
 "<b>7. Position size.</b> Small enough that going to zero is annoying, not life-changing.",
 "Most tokens fail at step 1 or 2. That's kind of the point."],
 comments=["#6 is the most important and the most ignored", "r:if it came from a DM it's a scam, 99% of the time", "would add: can you find who's behind it, and do they have any track record", "a:good one, adding 'team' as #8", "#7 should be #1 honestly", "printed this out lol", "r:same"]),
dict(type="analysis", title="L2 tokens — what's the value accrual?", body=[
 "using L2s is great, fees are tiny. but i keep wondering what the L2 token itself actually captures",
 "if users pay fees in ETH, the token is mostly governance? or am i missing something"],
 comments=["that's the main debate around them honestly", "some are working on fee sharing or using the token for sequencing, but it's early", "r:a lot of it is still 'future plans'", "a:so the product can succeed and the token still not capture much", "r:pretty much, product success != token success", "same question applies to a lot of tokens tbh"]),

# ───────────── stock_analysis ─────────────
dict(type="stock_analysis", title="Free cash flow vs earnings — the thing that finally clicked for me", body=[
 "For a long time I just looked at earnings per share. Then I compared a few companies' earnings to their free cash flow and they didn't match at all.",
 "Earnings include a lot of accounting choices — depreciation, stock-based comp treatment, one-offs.",
 "Free cash flow is roughly: cash from operations minus capital spending. It's the money the business actually generated.",
 "What I look for now:",
 "- FCF roughly tracking earnings over several years (big persistent gaps = dig deeper)",
 "- Stock-based compensation as a % of FCF — high SBC means shareholders are quietly paying",
 "- Whether capex is growing faster than revenue",
 "It's not perfect either, but together they tell a much more honest story than either alone."],
 comments=["SBC point is huge for tech companies", "r:'adjusted' earnings that exclude SBC drive me nuts", "a:same, it's a real cost. it's just paid in shares instead of cash", "capex-heavy businesses can look great on earnings and terrible on FCF", "good explainer for newer folks", "r:agreed, this took me years to figure out"]),
dict(type="stock_analysis", title="How I check if a company can survive a bad year", body=[
 "quick version: net debt vs cash flow, when the debt matures, and interest coverage",
 "a company with lots of debt due in the next 2 years and weak cash flow is the one that gets hurt in a downturn"],
 comments=["maturity schedule is so overlooked", "interest coverage under 3x makes me nervous", "a:yeah i use ~3x as a rough line too", "also check if the debt is fixed or floating"]),
dict(type="stock_analysis", title="anyone actually hunt spinoffs?", body=[
 "read that spinoffs often get sold off early because index funds and big holders dump them automatically",
 "does that still work or is it too well known now"],
 comments=["the forced selling part still happens, but everyone knows about it now", "some are spun off because the parent wants to get rid of a bad business. not all are hidden gems", "r:yeah sometimes it's literally taking out the trash", "a:so you still have to actually analyze the business. shocking", "r:lol always"]),

# ───────────── us_stock ─────────────
dict(type="us_stock", title="Fractional shares changed how I invest", body=[
 "Used to wait until I had enough for one full share of the expensive stuff.",
 "Now I just put a fixed amount in every payday and it buys whatever fraction it can. Way more consistent.",
 "Only downside: transferring fractional shares between brokers can be a pain."],
 comments=["the transfer thing is real, mine had to sell the fractions", "r:same, small taxable event, annoying", "fractional + auto invest is the best thing to happen to small investors", "a:agreed, removes so much friction"]),
dict(type="us_stock", title="REITs — anyone still holding through all the rate swings?", body=[
 "my REIT ETF has been a rollercoaster tied to rate expectations",
 "dividend is nice but the price moves have been rough. thinking about whether it's worth keeping"],
 comments=["REITs are very rate sensitive, that's kind of the deal", "depends on the sector. offices vs data centers vs residential are completely different stories", "r:'REITs' as one category hides a lot", "a:fair, mine is a broad one. maybe that's the issue", "I hold a small slice for diversification, don't expect much from it"]),
dict(type="us_stock", title="consumer staples are boring and i love them", body=[
 "people buy toothpaste in recessions. that's my whole thesis"],
 comments=["toothpaste thesis is undefeated", "valuations can get stretched though, 'safe' isn't always cheap", "a:true, i buy slowly", "r:boring + slow is a valid strategy"]),

# ───────────── kr_stock ─────────────
dict(type="kr_stock", title="Why do Korean preferred shares trade at a discount?", body=[
 "Looked at a few big Korean companies and noticed the preferred shares are cheaper than common, sometimes by a lot.",
 "They usually pay slightly higher dividends. So why the gap?",
 "My understanding so far: no voting rights, lower liquidity, and fewer foreign/index buyers. But the discount seems bigger than in other markets."],
 comments=["liquidity is a big part of it, pref shares trade way less", "governance concerns also feed into it, voting rights matter more when minority holders worry about being ignored", "r:ties into the whole 'korea discount' discussion", "a:that makes sense. so if governance improves the gap could narrow?", "r:that's the theory people argue about, yes", "some people specifically buy prefs for the dividend yield"]),
dict(type="kr_stock", title="Korean companies with US-listed ADRs?", body=[
 "don't have a Korean brokerage account. which Korean companies can I buy as ADRs on US exchanges?",
 "know about a couple of banks and a telecom, is there a list somewhere"],
 comments=["there are a handful — some financials, telecoms, a steel company, the power utility. not many big tech names", "r:the big chipmakers aren't US listed as regular ADRs, which is why people use ETFs", "a:ah that explains why everyone talks about EWY", "check the depositary banks' ADR directories, they list them all", "volume on some of them is pretty low, use limit orders"]),
dict(type="kr_stock", title="Korean retail traders seem extremely active — does it make the market more volatile?", body=[
 "Every time I read about the Korean market, retail participation seems huge, especially on the smaller boards.",
 "Does that make price action more theme-driven? I've noticed some sectors move together very fast on news."],
 comments=["theme stocks are definitely a thing there, whole groups move on one headline", "KOSDAQ especially. KOSPI big caps are more driven by foreign flows", "r:foreigners and institutions vs retail is a constant storyline in korean market news", "a:interesting, so watching foreign net buying is a thing?", "r:very much so, it's reported daily", "makes it fun to watch, scary to trade"]),

# ───────────── news ─────────────
dict(type="news", title="How I filter crypto 'BREAKING' headlines", body=[
 "Half the 'breaking news' accounts are wrong, early, or recycled. My filter:",
 "1. Is there a primary source? (official announcement, filing, regulator site)",
 "2. Is the account known for deleting tweets after being wrong?",
 "3. Did the price already move before the headline? Then I'm late anyway.",
 "4. Does it actually change anything for what I hold long term? Usually no.",
 "Most headlines fail #4, which means I can just ignore them."],
 comments=["#3 is so true, by the time it's a headline the move is done", "r:'buy the rumor sell the news' exists for a reason", "fake screenshots of announcements are getting really common too", "a:yeah, always go to the source directly", "good habits. the all-caps BREAKING accounts are mostly engagement farming"]),
dict(type="news", title="Index rebalancing days: why volume spikes at the close", body=[
 "If you've ever seen weird volume at the close on certain days, it's often index rebalancing.",
 "Index funds have to buy what's being added and sell what's being removed, usually at the closing price.",
 "For long-term investors it doesn't matter much. For short-term traders it explains some strange moves.",
 "Index providers publish their rebalance schedules, worth knowing when they are."],
 comments=["this explains so many random end-of-day spikes I've seen", "stocks getting added to a big index often run up before the date as people front-run it", "r:and sometimes give it back after", "a:yep, the 'inclusion pop' is a known thing but not guaranteed"]),

# ───────────── profit ─────────────
dict(type="profit", title="Bought an IPO on day one. -31%.", body=[
 "Everyone was talking about it. Bought at the open on listing day because I didn't want to miss it.",
 "The first day pop was mostly over by the time retail could get in. It's been sliding since.",
 "Lesson: by the time an IPO is a household conversation, I'm the exit liquidity.",
 "Still holding a small amount because I actually like the product, but sized way down."],
 comments=["day one IPO buying is rough, the lockup expiry later can hurt too", "r:lockup expiry got me on a different one. insiders sold, price dropped", "a:wasn't even thinking about lockups. great, another thing to worry about", "waiting a few quarters of public earnings has saved me a lot", "honest post, thanks for sharing"]),
dict(type="profit", title="+8% on my bond ladder. felt absolutely nothing", body=[
 "no excitement, no stress, just coupons arriving",
 "this must be what adults feel like"],
 comments=["welcome to the boring club, we have snacks", "r:the snacks are also boring", "this is the dream honestly", "a:it's kinda nice not caring"]),
dict(type="profit", title="took 20% profit to buy a car. no regrets", body=[
 "had a decent run on some holdings. sold 20%, paid cash for a used car, no loan",
 "the rest keeps going. people keep saying 'but what if it goes up more'. ok and? i have a car"],
 comments=["profits aren't real until you use them for something", "r:this", "paying cash for a car instead of a loan is a win by itself", "a:that was the main point for me, hate car loans", "never regret taking some profit"]),
dict(type="profit", title="staking rewards +17%, coin itself -24%. math is not mathing", body=[
 "got a bunch more coins from staking over the year",
 "total value in dollars is still down. the extra coins just softened the drop"],
 comments=["yep, staking yield is denominated in the coin. classic lesson", "at least you have more coins if it recovers", "a:that's the copium i'm running on", "r:it's decent copium tbh"]),
dict(type="profit", title="Paper traded for 6 months, then went live. Very different results.", body=[
 "Paper account: +21% over 6 months. Felt like a genius.",
 "Real money, next 6 months, same strategy: -6% after fees.",
 "What changed:",
 "- I didn't cut losers fast with real money. On paper it was easy.",
 "- Fills were worse than the paper sim assumed",
 "- I traded more when bored or angry",
 "Strategy wasn't the problem. I was. Switched mostly to index and keep a small account for active stuff."],
 comments=["paper trading doesn't teach you emotions, that's the whole gap", "r:you can't paper trade fear", "fills point is real, sims assume perfect execution", "a:the slippage alone ate a few % over the year", "respect for posting the real numbers", "keeping a small 'play' account is a good compromise"]),
]
