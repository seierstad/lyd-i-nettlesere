/* lag audioContext og aktiver den etter bruker-interaksjon */

let context;

const bliLyd = (event) => {
    context = new AudioContext();
};

const aktiveringsDialog = document.getElementById("bli-lyd");
aktiveringsDialog.addEventListener("close", bliLyd, {once: true});




/* funksjoner for å lage en oscillator-node, koble den til lydutgangen, starte og stoppe */

/* envelope = omhylningskurve */

let oscillator;
let omhyler;

function nyOscillator () {
    oscillator = context.createOscillator();
    omhyler = context.createGain();

    oscillator.connect(omhyler);
    omhyler.connect(context.destination);
}

const ATTACK_TIME_S = 0.2;
const DECAY_TIME_S = 0.1;
const SUSTAIN_LEVEL = 0.5;
const RELEASE_TIME_S = 0.5;

function startOscillator () {
    oscillator.start();
    omhyler.gain.setValueAtTime(0, context.currentTime);
    omhyler.gain.linearRampToValueAtTime(1, context.currentTime + ATTACK_TIME_S);

    setTimeout(
        () => omhyler.gain.linearRampToValueAtTime(SUSTAIN_LEVEL, context.currentTime + DECAY_TIME_S),
        ATTACK_TIME_S * 1000
    );
}

function stoppOscillator () {
    const stopptid = context.currentTime + RELEASE_TIME_S;
    oscillator.stop(stopptid);
    omhyler.gain.linearRampToValueAtTime(0, stopptid);
    oscillator.addEventListener("ended", nyOscillator, {once: true});
}

function settFrekvens (event) {
    const frekvens = parseFloat(event.target.value);
    oscillator.frequency.setValueAtTime(frekvens, context.currentTime);
}

function settWaveform (event) {
    oscillator.type = event.target.value;
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

const oscillatorWaveform = document.getElementById("oscillator-waveform");
oscillatorWaveform.addEventListener("change", settWaveform);


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
                    console.log({width: bilde.width, height: bilde.height});

                    //context.filter = 'blur(10px)';
                    canvasCtx.drawImage(bilde, 0, 0);
                    const piksler = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);

                    for (let i =  bilde.width * 2; i < piksler.data.length; i += (4 * bilde.width)) {
                        piksler.data[i] /= 2;
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


