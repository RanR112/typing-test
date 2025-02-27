import Texts from '../global/Texts';

export function getRandomText(currentId) {
    const filteredTexts = Texts.filter(item => item.id !== currentId);
    const randomIndex = Math.floor(Math.random() * filteredTexts.length);
    return filteredTexts[randomIndex];
}
