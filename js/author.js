// Source: https://codepen.io/FlorinPop17/pen/PooXqaQ

const boxes = document.getElementsByClassName('box');

boxes.forEach(b=> {
    setInterval(setBorderRadius, 300);

    function setBorderRadius() {
        b.style.setProperty('--br-blobby', generateBorderRadiusValue());
        b.style.setProperty('--br-blobby-after', generateBorderRadiusValue());
        b.style.setProperty('--br-blobby-before', generateBorderRadiusValue());
    }
})


function generateBorderRadiusValue() {
    return `${getRandomValue()}% ${getRandomValue()}% ${getRandomValue()}% ${getRandomValue()}% / ${getRandomValue()}% ${getRandomValue()}% ${getRandomValue()}%`;
}

function getRandomValue() {
    return Math.floor(Math.random() * 50) + 50;
}