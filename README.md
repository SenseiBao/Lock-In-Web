# Lock-In (Web Version)

A digital implementation of the stack-based card game **Lock-In**, built with React, Vite, and Tailwind CSS.

> This is a work in progress. There is also a Java version developed prior to this. Physical editions may be made later.
>
> **Live at:** https://lock-in-web-kappa.vercel.app/

---

## 🎮 Game Rules

### I. Game Overview
* **Format:** Stack-based card game
* **Players:** 4+ players, divided into 2 teams.
* **Roles:** 1 Describer and 1+ Guessers per team.
* **Objective:** First team to capture the majority of the cards wins the game.
* **Total Deck Size:** 25 cards per round (or any arbitrary odd number).

---

### II. The Standard Turn Flow

1. **Choosing the Team to Go First**
   * Flip a coin. Whoever wins gets to give the first hint.
   * From this point onward, which team gives the first hint alternates each round.

2. **The Draw**
   * A card is drawn from the stack.
   * Only the **Describers** from each team may look at it.
   * A **60-second round timer** starts automatically. If time runs out before the word is guessed, the card is discarded — neither team scores.

3. **The Activation Roll**
   * Roll a single six-sided die (D6).
   * **Roll 1–4:** Standard Round. No special constraints.
   * **Roll 5–6:** Power-up Round. Roll the D6 again to determine which neutral constraint applies (see Section III).

4. **The Clues**
   * Describers alternate giving **one-word hints** back and forth within the 60-second window.
   * Each guesser may attempt a guess after their team's hint.
   * There is no escalation — hints remain one word for the entire round.

---

### III. Neutral Power-Up Table (Roll on a 5 or 6)
*Power-ups affect both teams equally and are meant to add a challenge.*

| Roll | Power-Up | Description |
| :---: | :--- | :--- |
| **1** | **Whiteboard Challenge** | **No words!** Both Describers draw on their own whiteboards at the same time. |
| **2** | **Simultaneous Charades** | **No words.** Both Describers act out the word at the same time. Noises and sounds are allowed. |
| **3** | **Low Bandwidth** | Describers can only use **one-syllable words** for their hints. |
| **4** | **Data Corruption** | A letter is automatically chosen and is **forbidden** from all hints:<br>1=**E**, 2=**T**, 3=**A**, 4=**O**, 5=**I**, 6=**N** |
| **5** | **High Traffic** | **No alternating!** Both Describers can give hints nonstop at the same time. |
| **6** | **Reverse Roles** | The Guesser now describes and the Describer now guesses. Draw a **new card** for this turn only. |

---

### IV. Action Rules & Penalties

#### Skips
* **Describers** have the option to skip a difficult card at any time.
* Both teams must agree to skip — once skipped, the card is discarded.

#### The "Lock-In" Mechanic
* Guessers can choose to **"Lock In"** a specific guess.
* **Penalty:** If a "Locked In" guess is wrong, that guesser's buzzer is put on a **6-second cooldown** before they can buzz again.
