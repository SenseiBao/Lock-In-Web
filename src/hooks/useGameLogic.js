import { useState, useCallback } from 'react';

// Your word list (expand this later!)
const INITIAL_WORDS = ["NEBULA", "CHRONOS", "ALGORITHM", "JAVA", "REACT"];

export const useGameLogic = () => {
    const [deck, setDeck] = useState(() => [...INITIAL_WORDS].sort(() => Math.random() - 0.5));
    const [currentWord, setCurrentWord] = useState(null);
    const [teamAScore, setTeamAScore] = useState(0);
    const [teamBScore, setTeamBScore] = useState(0);
    const [teamAWords, setTeamAWords] = useState([]);
    const [teamBWords, setTeamBWords] = useState([]);

    const drawCard = useCallback(() => {
        if (deck.length === 0) return "GAME OVER";
        const newDeck = [...deck];
        const word = newDeck.pop();
        setDeck(newDeck);
        setCurrentWord(word);
        return word;
    }, [deck]);

    const recordWin = (isTeamA) => {
        if (!currentWord || currentWord === "GAME OVER") return;

        if (isTeamA) {
            setTeamAScore(prev => prev + 1);
            setTeamAWords(prev => [...prev, currentWord]);
        } else {
            setTeamBScore(prev => prev + 1);
            setTeamBWords(prev => [...prev, currentWord]);
        }
        setCurrentWord(null);
    };

    const resetGame = () => {
        setDeck([...INITIAL_WORDS].sort(() => Math.random() - 0.5));
        setTeamAScore(0);
        setTeamBScore(0);
        setTeamAWords([]);
        setTeamBWords([]);
        setCurrentWord(null);
    };

    return {
        currentWord,
        deckCount: deck.length,
        teamAScore,
        teamBScore,
        teamAWords,
        teamBWords,
        drawCard,
        recordWin,
        resetGame
    };
};