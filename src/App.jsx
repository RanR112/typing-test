import { useState, useEffect, useRef } from 'react';
import './App.css';
import { getRandomText } from './model/Text';

function App() {
    const [randomText, setRandomText] = useState(getRandomText(null));
    const [inputValue, setInputValue] = useState('');
    const [completedWords, setCompletedWords] = useState([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [errorCount, setErrorCount] = useState(0);
    const [hasTypingError, setHasTypingError] = useState(false);
    const [totalCharacters, setTotalCharacters] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [timeLimit, setTimeLimit] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isTimedOut, setIsTimedOut] = useState(false);
    const [wpm, setWpm] = useState(0);
    const inputRef = useRef(null);
    const timerRef = useRef(null);

    // Split text into words for easier comparison
    const words = randomText.text.split(' ');
    
    // Get current word that user is typing
    const currentWord = words[currentWordIndex] || '';

    // Calculate total characters and set time limit when text changes
    useEffect(() => {
        const chars = randomText.text.length;
        setTotalCharacters(chars);
        
        // Calculate time limit based on text length (30 seconds per 100 characters, minimum 30 seconds)
        const calculatedTimeLimit = Math.max(30, Math.ceil(chars / 100) * 30);
        setTimeLimit(calculatedTimeLimit);
        setTimeRemaining(calculatedTimeLimit);
    }, [randomText]);

    // Start timer when first key is pressed
    useEffect(() => {
        if (inputValue.length === 1 && !isActive && !startTime) {
            setIsActive(true);
            setStartTime(Date.now());
        }
    }, [inputValue, isActive, startTime]);

    // Countdown timer logic
    useEffect(() => {
        if (isActive && !isCompleted && !isTimedOut) {
            timerRef.current = setInterval(() => {
                const currentTime = Date.now();
                const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
                const remaining = timeLimit - elapsedSeconds;
                
                setTimeRemaining(remaining);
                
                if (remaining <= 0) {
                    clearInterval(timerRef.current);
                    setTimeRemaining(0);
                    setIsTimedOut(true);
                    setIsActive(false);
                }
            }, 1000);
        } else if (!isActive || isCompleted || isTimedOut) {
            clearInterval(timerRef.current);
        }
        
        return () => clearInterval(timerRef.current);
    }, [isActive, isCompleted, startTime, timeLimit, isTimedOut]);

    // Auto-complete only when the entire current word is fully typed correctly
    useEffect(() => {
        if (inputValue === currentWord && inputValue.length > 0 && currentWord.length > 0) {
            const isLastWord = currentWordIndex === words.length - 1;
            
            // Check if we've reached the last word and have entered it correctly
            if (isLastWord) {
                // This is the last word, complete the exercise
                setIsCompleted(true);
                setEndTime(Date.now());
                setIsActive(false);
                
                // Calculate WPM
                calculateWPM();
            }
        }
    }, [inputValue, currentWord, currentWordIndex, words.length]);

    // Focus input whenever the component updates
    useEffect(() => {
        inputRef.current?.focus();
    }, [inputValue, currentWordIndex]);

    function calculateWPM() {
        // Calculate elapsed time in minutes
        const elapsedSeconds = endTime ? Math.floor((endTime - startTime) / 1000) : timeLimit - timeRemaining;
        const minutes = elapsedSeconds / 60;
        
        // Standard calculation: (total words / minutes)
        // A word is standardized as 5 characters
        const standardWords = totalCharacters / 5;
        const calculatedWpm = Math.round(standardWords / minutes);
        setWpm(calculatedWpm);
    }

    function handleStartClick() {
        setRandomText(prevText => getRandomText(prevText?.id));
        setInputValue('');
        setCompletedWords([]);
        setCurrentWordIndex(0);
        setErrorCount(0);
        setHasTypingError(false);
        setIsCompleted(false);
        setStartTime(null);
        setEndTime(null);
        setWpm(0);
        setIsActive(false);
        setIsTimedOut(false);
        // Reset the time limit and remaining time
        const chars = randomText.text.length;
        const calculatedTimeLimit = Math.max(30, Math.ceil(chars / 100) * 30);
        setTimeLimit(calculatedTimeLimit);
        setTimeRemaining(calculatedTimeLimit);
        clearInterval(timerRef.current);
        inputRef.current?.focus();
    }

    function handleInputChange(e) {
        const newValue = e.target.value;
        
        // Handle space for mobile devices by checking if the last character is a space
        if (newValue.endsWith(' ') && newValue.length > inputValue.length) {
            // Same logic as handleKeyDown for space key
            const inputWithoutSpace = newValue.slice(0, -1); // Remove the trailing space
            const isExactMatch = inputWithoutSpace === currentWord;
            
            if (isExactMatch) {
                // Add current word to completed words
                setCompletedWords(prev => [...prev, { word: currentWord, isCorrect: true }]);
                
                // Move to next word
                setCurrentWordIndex(currentWordIndex + 1);
                
                // Reset input
                setInputValue('');
                setHasTypingError(false);
                
                // Check if we've reached the end
                if (currentWordIndex === words.length - 1) {
                    setIsCompleted(true);
                    setEndTime(Date.now());
                    setIsActive(false);
                    calculateWPM();
                }
                return; // Exit the function after handling the space
            }
        }
        
        setInputValue(newValue);
        
        // Check for errors in current input
        if (!hasTypingError && newValue.length <= currentWord.length) {
            for (let i = 0; i < newValue.length; i++) {
                if (newValue[i] !== currentWord[i]) {
                    setErrorCount(prev => prev + 1);
                    setHasTypingError(true);
                    break;
                }
            }
        }
    }

    function handleKeyDown(e) {
        // Check if space key is pressed (works on all devices)
        if (e.key === ' ' || e.key === 'Spacebar' || e.keyCode === 32) {
            e.preventDefault(); // Prevent default space behavior
            
            // Check if current input matches current word exactly
            const isExactMatch = inputValue === currentWord;
            
            if (isExactMatch) {
                // Add current word to completed words
                setCompletedWords(prev => [...prev, { word: currentWord, isCorrect: true }]);
                
                // Move to next word
                setCurrentWordIndex(currentWordIndex + 1);
                
                // Reset input
                setInputValue('');
                setHasTypingError(false);
                
                // Check if we've reached the end
                if (currentWordIndex === words.length - 1) {
                    setIsCompleted(true);
                    setEndTime(Date.now());
                    setIsActive(false);
                    calculateWPM();
                }
            } else {
                // Do not reset input if there's any error in the word
                // Just add a space to the input
                setInputValue(inputValue + ' ');
            }
        }
    }

    function calculateAccuracy() {
        if (errorCount === 0) return 100;
        const accuracy = ((totalCharacters - errorCount) / totalCharacters) * 100;
        return Math.max(0, Math.round(accuracy * 100) / 100); // Round to 2 decimal places
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function getElapsedTime() {
        if (!startTime) return 0;
        if (endTime) return Math.floor((endTime - startTime) / 1000);
        return timeLimit - timeRemaining;
    }

    function renderText() {
        let renderedText = [];
        
        // CSS for consistent character sizing
        const charStyle = {
            display: 'inline',
            width: '10px', 
            height: '24px',
            textAlign: 'justify',
        };
        
        // Render completed words
        completedWords.forEach((wordObj, wordIndex) => {
            const { word, isCorrect } = wordObj;
            
            // Render each character of completed word
            word.split('').forEach((char, i) => {
                renderedText.push(
                    <span 
                        key={`completed-${wordIndex}-${i}`} 
                        style={{
                            ...charStyle,
                            color: isCorrect ? 'green' : 'white',
                            backgroundColor: isCorrect ? 'transparent' : 'red'
                        }}
                    >
                        {char}
                    </span>
                );
            });
            
            // Add space after word (except after the last completed word if it's the final word)
            if (!(wordIndex === completedWords.length - 1 && currentWordIndex >= words.length)) {
                renderedText.push(
                    <span 
                        key={`space-${wordIndex}`} 
                        style={{
                            ...charStyle,
                            color: 'gray'
                        }}
                    >
                        {' '}
                    </span>
                );
            }
        });

        // Get the full input including spaces
        const fullInput = inputValue;
        
        // Render current word being typed and following words
        for (let wordIndex = currentWordIndex; wordIndex < words.length; wordIndex++) {
            const word = words[wordIndex] + ' ';
            
            if (wordIndex === currentWordIndex) {
                // Current word being typed
                let errorFound = false;
                let errorPosition = -1;
                
                // First check if there is an error and at what position
                for (let i = 0; i < Math.min(fullInput.length, word.length); i++) {
                    if (fullInput[i] !== word[i]) {
                        errorFound = true;
                        errorPosition = i;
                        break;
                    }
                }
                
                // Then render the characters
                word.split('').forEach((char, charIndex) => {
                    const isTyped = charIndex < fullInput.length;
                    const isCorrect = isTyped && fullInput[charIndex] === char;
                    const shouldHighlightError = errorFound && charIndex >= errorPosition;
                    
                    renderedText.push(
                        <span 
                            key={`current-${wordIndex}-${charIndex}`} 
                            style={{
                                ...charStyle,
                                color: shouldHighlightError ? 'white' : (isTyped ? (isCorrect ? 'green' : 'white') : 'gray'),
                                backgroundColor: shouldHighlightError ? 'red' : (isTyped && !isCorrect ? 'red' : 'transparent')
                            }}
                        >
                            {char}
                        </span>
                    );
                });
            } else {
                // Future words
                word.split('').forEach((char, charIndex) => {
                    renderedText.push(
                        <span 
                            key={`future-${wordIndex}-${charIndex}`} 
                            style={{
                                ...charStyle,
                                color: 'gray'
                            }}
                        >
                            {char}
                        </span>
                    );
                });
            }
        }

        return renderedText;
    }

    return (
        <section>
            <h3>Typing Test</h3>
            
            <div className="timer-container" style={{ marginBottom: '15px' }}>
                <div style={{ 
                    padding: '2px', 
                    borderRadius: '5px', 
                    backgroundColor: '#f5f5f5', 
                    display: 'inline-block', 
                    minWidth: '80px',
                    textAlign: 'center',
                    border: '1px solid #ddd'
                }}>
                    <span style={{ fontWeight: 'bold', fontSize: '18px', color: timeRemaining < ((timeLimit/100) * 15) ? 'red' : timeRemaining < ((timeLimit/100) * 30) ? 'orange' : '#333' }}>
                        {formatTime(timeRemaining)}
                    </span>
                </div>
            </div>
            
            <div className='typing'>
                <p className="text">
                    {renderText()}
                </p>
                {!isCompleted && !isTimedOut && (
                    <input 
                        type="text" 
                        value={inputValue} 
                        onChange={handleInputChange} 
                        onKeyDown={handleKeyDown}
                        ref={inputRef}
                        autoFocus 
                        disabled={isCompleted || isTimedOut}
                        style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '18px',
                            display: isCompleted || isTimedOut ? 'none' : 'block'
                        }}
                    />
                )}
                <br />
                <br />
                <button onClick={handleStartClick}>New Text</button>
                
                {(isCompleted || isTimedOut) && (
                    <div className="results" style={{  marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
                        <h3>Hasil Mengetik</h3>
                        <p>Total Karakter: {totalCharacters}</p>
                        <p>Kata Per Menit (WPM): <span style={{ fontWeight: 'bold', color: wpm > 40 ? 'green' : wpm > 25 ? 'orange' : 'red' }}>{wpm}</span></p>
                        <p>Jumlah Kesalahan: {errorCount}</p>
                        <p>Akurasi: {calculateAccuracy()}%</p>
                        <p>Waktu: {formatTime(getElapsedTime())}</p>
                        <p style={{ 
                            color: isTimedOut ? 'red' : (calculateAccuracy() > 90 ? 'green' : calculateAccuracy() > 70 ? 'orange' : 'red'), 
                            fontWeight: 'bold' 
                        }}>
                            {isTimedOut ? 'Waktu Habis!' : (calculateAccuracy() > 90 ? 'Sangat Baik!' : calculateAccuracy() > 70 ? 'Cukup Baik' : 'Perlu Latihan Lagi')}
                        </p>
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ fontSize: '14px', color: '#666' }}>
                                {wpm < 20 ? 'Kecepatan mengetik Anda masih di bawah rata-rata. Teruslah berlatih!' :
                                wpm < 40 ? 'Kecepatan mengetik Anda sudah cukup baik. Tetap berlatih untuk meningkatkan kecepatan.' :
                                wpm < 60 ? 'Kecepatan mengetik Anda di atas rata-rata. Bagus!' :
                                'Kecepatan mengetik Anda sangat cepat. Luar biasa!'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default App;