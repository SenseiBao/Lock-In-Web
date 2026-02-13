import { useState, useCallback } from "react";
import useSound from 'use-sound';
import powerupSfx from '../assets/sounds/powerup.mp3';

/* -------------------- */
/* Utility: Shuffle     */
/* -------------------- */
const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

/* -------------------- */
/* Word List            */
/* -------------------- */
const INITIAL_WORDS = [
    "APPLE", "BREAD", "CHAIR", "EAGLE", "GLASS", "HOUSE", "ISLAND", "JACKET", "KITCHEN", "LEMON",
    "MOUNTAIN", "ORANGE", "PILLOW", "QUEEN", "RIVER", "STREET", "TABLE", "UMBRELLA", "VALLEY", "WINDOW",
    "ZEBRA", "AIRPORT", "CAMERA", "ENGINE", "FOREST", "GARDEN", "HAMMER", "INSECT", "LADDER", "MIRROR",
    "OCEAN", "POCKET", "RABBIT", "SCHOOL", "TIGER", "VILLAGE", "WALNUT", "BOTTLE", "COFFEE", "DESERT",
    "ELBOW", "FINGER", "GUITAR", "HELMET", "ICEBERG", "JUNGLE", "KNIFE", "LETTER", "MONKEY", "OVEN",
    "PENCIL", "ROCKET", "SADDLE", "TOMATO", "VIOLIN", "BAMBOO", "CRAYON", "DRAGON", "FLOWER", "GHOST",
    "HARBOR", "IRON", "KANGAROO", "LANTERN", "MAGNET", "NEEDLE", "ONION", "PARROT", "REMOTE", "SILVER",
    "TUNNEL", "UNIFORM", "VACUUM", "WAGON", "XRAY", "ANCHOR", "BUBBLE", "CASTLE", "DOCTOR", "FARMER",
    "GOBLIN", "HUNTER", "INFANT", "JOKER", "KNIGHT", "LAWYER", "PLAYER", "TARGET", "VESSEL", "WIZARD",
    "ACTOR", "DANCE", "JOURNEY", "PARTY", "RECORD", "ATTACK", "ESCAPE", "BUILD", "CHASE", "BRIGHT",
    "COLD", "DARK", "FAST", "HAPPY", "LARGE", "MODERN", "NOBLE", "PROUD", "QUICK", "SMALL",
    "TOUGH", "WILD", "YOUNG", "CLEAN", "DIRTY", "EARLY", "FULL", "GREEN", "HEAVY", "LIGHT",
    "MUDDY", "NARROW", "PLAIN", "QUIET", "READY", "SHARP", "THICK", "WIDE", "BRAVE", "FINAL",
    "GRAND", "HUGE", "LUCKY", "MAGIC", "FAMOUS"
];

const POWER_UPS = {
    1: { name: "Whiteboard Challenge", desc: "Share a whiteboard. Describers take turns drawing one continuous stroke." },
    2: { name: "Simultaneous Charades", desc: "No talking. Both Describers act out the word at the same time." },
    3: { name: "Low Bandwidth", desc: "Describers can only use one-syllable words for hints." },
    4: { name: "Data Corruption", desc: "Forbidden Letters! Roll again: 1=E, 2=T, 3=A, 4=O, 5=I, 6=N." },
    5: { name: "High Traffic", desc: "Simultaneous Guessing: Both Describers hint and both Guessers shout." },
    6: { name: "Lookahead", desc: "Both Guessers view 3 random cards. Shuffle, draw new, and re-roll." }
};

/* -------------------- */
/* Game Logic Hook      */
/* -------------------- */
export const useGameLogic = () => {

    const [deck, setDeck] = useState(() => shuffle(INITIAL_WORDS));
    const [currentWord, setCurrentWord] = useState(null);

    const [teamAScore, setTeamAScore] = useState(0);
    const [teamBScore, setTeamBScore] = useState(0);

    const [teamAWords, setTeamAWords] = useState([]);
    const [teamBWords, setTeamBWords] = useState([]);

    const [diceResult, setDiceResult] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [activePowerUp, setActivePowerUp] = useState(null);
    const [playPowerUp] = useSound(powerupSfx);

    const [phase, setPhase] = useState("idle");
    // idle | drawn | resolved

    /* -------------------- */
    /* Dice Logic           */
    /* -------------------- */
    const rollDice = () => {
        if (isRolling) return; // prevent spamming

        setIsRolling(true);
        setActivePowerUp(null); // clear old powerup

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 6) + 1;
            setDiceResult(roll);

            // Trigger powerup sound only if this roll is 6
            if (roll === 6) {
                if (!activePowerUp) { // only play if no active powerup yet
                    playPowerUp();
                }
                const powerRoll = Math.floor(Math.random() * 6) + 1;
                setActivePowerUp(POWER_UPS[powerRoll]);
            }

            setIsRolling(false);
        }, 600);
    };

    /* -------------------- */
    /* Draw Card            */
    /* -------------------- */
    const drawCard = useCallback(() => {
        if (deck.length === 0) {
            setCurrentWord(null);
            return null;
        }

        const newDeck = [...deck];
        const word = newDeck.pop();

        setDeck(newDeck);
        setCurrentWord(word);
        setPhase("drawn");

        return word;
    }, [deck]);

    /* -------------------- */
    /* Record Win           */
    /* -------------------- */
    const recordWin = (isTeamA) => {
        if (!currentWord) return;

        const word = currentWord;

        if (isTeamA) {
            setTeamAScore(prev => prev + 1);
            setTeamAWords(prev => [...prev, word]);
        } else {
            setTeamBScore(prev => prev + 1);
            setTeamBWords(prev => [...prev, word]);
        }

        setCurrentWord(null);
        setPhase("resolved");
    };

    /* -------------------- */
    /* Reset Game           */
    /* -------------------- */
    const resetGame = () => {
        setDeck(shuffle(INITIAL_WORDS));
        setTeamAScore(0);
        setTeamBScore(0);
        setTeamAWords([]);
        setTeamBWords([]);
        setCurrentWord(null);
        setDiceResult(null);
        setPhase("idle");
        setActivePowerUp(null);
    };

    /* -------------------- */
    /* Win Condition        */
    /* -------------------- */
    const winner =
        teamAScore >= 13 ? "A" :
            teamBScore >= 13 ? "B" :
                null;

    return {
        // state
        currentWord,
        deckCount: deck.length,
        teamAScore,
        teamBScore,
        teamAWords,
        teamBWords,
        diceResult,
        isRolling,
        activePowerUp,
        phase,
        winner,

        // actions
        drawCard,
        recordWin,
        resetGame,
        rollDice,
        setPhase
    };
};
