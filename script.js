/* lag audioContext og aktiver den etter bruker-interaksjon */

let context;

const bliLyd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    context = new AudioContext();
    const knapp = event.target;
    knapp.parentElement.removeChild(knapp);
};

const aktivKnapp = document.getElementById("bli-lyd");
aktivKnapp.addEventListener("click", bliLyd, {once: true});




/* funksjoner for å lage en oscillator-node, koble den til lydutgangen, starte og stoppe */

let oscillator;

function nyOscillator () {
    oscillator = context.createOscillator();
    oscillator.connect(context.destination);
}

function startOscillator () {
    oscillator.start();
}

function stoppOscillator () {
    oscillator.stop();
}

function settFrekvens (event) {
    const frekvens = parseFloat(event.target.value);
    oscillator.frequency.setValueAtTime(frekvens, context.currentTime);
}


/* finne html-elementene som skal styre funksjonene og sørge for at funksjonene kjører når vi klikker på dem */

const nyOscillatorKnapp = document.getElementById("ny-oscillator");
nyOscillatorKnapp.addEventListener("click", nyOscillator);

const startOscillatorKnapp = document.getElementById("start-oscillator");
startOscillatorKnapp.addEventListener("click", startOscillator);

const stoppOscillatorKnapp = document.getElementById("stopp-oscillator");
stoppOscillatorKnapp.addEventListener("click", stoppOscillator);

const frekvensSpak = document.getElementById("oscillator-frekvens-spak");
frekvensSpak.addEventListener("input", settFrekvens);


/* canvas */

const canvas = document.getElementById("lerret");
const canvasCtx = canvas.getContext("2d");


/* setter opp dra-og-slipp av billedfiler til canvas-elementet  */

function ikkeByttSide (event) {
    event.preventDefault();
}

let filLeser;

function lastBilde (event) {
    event.preventDefault();
    if (event.dataTransfer.items) {
        [...event.dataTransfer.items].filter(item => item.kind === "file" && item.type.indexOf("image/") === 0).forEach((item, i) => {
            const fil = item.getAsFile();
            filLeser = new FileReader();
            filLeser.readAsDataURL(fil);

            filLeser.onload = () => {
                const bilde = new Image();
                bilde.src = filLeser.result;
                bilde.onload = () => {
                    canvas.width = bilde.width;
                    canvas.height = bilde.height;

                    //context.filter = 'blur(10px)';
                    canvasCtx.drawImage(bilde, 0, 0);
                    const piksler = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);

                    for (let i = 0; i < piksler.data.length; i += 4) {
                        piksler.data[i] /= 3;
                    }
                    canvasCtx.putImageData(piksler, 0, 0);
                }
            }
            console.log(`… fil[${i}].name = ${fil.name}`);
        })
    }
}

canvas.addEventListener("dragover", ikkeByttSide);
canvas.addEventListener("drop", lastBilde);


/*
    var imgData = ctx.getImageData(0, 0, c.width, c.height);
    // invert colors
    for (var i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i] = 255 - imgData.data[i];
        imgData.data[i + 1] = 255 - imgData.data[i + 1];
        imgData.data[i + 2] = 255 - imgData.data[i + 2];
        imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
*/
