# Factors

**Empty on purpose.** The first factors arrive in Block 1, and none of them may be written here by
Claude alone.

A *factor* is how much material one unit of work takes: 12.5 hollow blocks per square metre, 9 bags of
cement per cubic metre of class A concrete. Every number Tantya prints is one of these multiplied by
something a user measured.

## The rule this file exists to enforce

**Tests cannot prove a factor is right.** They prove the code matches this table. Whether this table
matches reality is a question no test can ask — so it is answered here, by a person, with a book open.

For every factor:

| Column | What goes in it |
|---|---|
| **Key** | The engine's key for it, e.g. `chb.blocks.per.m2` |
| **Value** | In whole millionths. 12.5 is `12500000` |
| **Unit** | What the value counts, e.g. `pcs/m²` |
| **Net or includes-allowance** | Whether the book's number already has waste built in. Get this wrong and wastage is added twice |
| **Source** | Book, edition, page or table number. Not "the internet" |
| **Verified on** | The date **you** checked it against the book. Empty means unverified |

An unverified factor is not a blocker while you build: it shows in the app behind an **"unverified"
chip**, so nobody mistakes it for a checked number. It becomes a blocker at release —
`npm run test:release` fails while any production factor has an empty `verifiedOn`.

## Before Block 1 starts

Choose the reference book, and say which one. The recommendation in `PLAN.md` is Fajardo's
*Simplified Construction Estimate*, but any reference you actually trust and can hold in your hand is
better than one you don't. Tantya includes only the factors it uses, each one cited.

## The table

*(empty — Block 1)*

| Key | Value (millionths) | Unit | Net / includes-allowance | Source | Verified on |
|---|---|---|---|---|---|
