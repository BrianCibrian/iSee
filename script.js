const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');
const imgInput = document.getElementById('image-input');
const displayImg = document.querySelector('#displayImg');
const uploadedImage = document.getElementById('uploadedImage');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const imageView = document.getElementById('imageView');
const buttonTTS = document.getElementById('buttonTTS')
const subtitle = document.getElementById('subtitle');
const notif = document.getElementById('notif');
const gifHolder = document.getElementById('gifs');
const gifButton = document.querySelector("#gifButton");
let object = "";
var predictionsTTS = new SpeechSynthesisUtterance();
const micInstructions = document.querySelector("#micInstructions");

const listenButton = document.querySelector("#listenButton")

//Speech recognition
const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || webkitSpeechGrammarList;
const SpeechRecognitionEvent = window.SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

const words = ['look'];
const grammar = `#JSGF V1.0; grammar words; public <word> = look;`

const recognition = new SpeechRecognition();
const speechRecognitionList = new SpeechGrammarList();

speechRecognitionList.addFromString(grammar, 1);

recognition.grammars = speechRecognitionList;
recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

const diagnostic = document.querySelector('#diagnostic');
const bg = document.querySelector('html');
const hints = document.querySelector('.hints');

let wordHTML = '';

listenButton.onclick = () => {
  micInstructions.textContent = 'Say "look" into the microphone to hear what the program detected from your camera!'
  recognition.start();
  console.log('Ready to receive a command.');
};
//Speech Synthesis
recognition.onresult = (event) => {
  const word = event.results[0][0].transcript;
  diagnostic.textContent = `Result received: ${word}.`;
  console.log(`Confidence: ${event.results[0][0].confidence}`);
  console.log(word);
  if (word.includes('look')) {
    window.speechSynthesis.speak(predictionsTTS);
  }
}

recognition.onspeechend = () => {
  recognition.stop();
}
recognition.onnomatch = (event) => {
  diagnostic.textContent = "I didn't recognize that command.";
}

recognition.onerror = (event) => {
  diagnostic.textContent = `Error occurred in recognition: ${event.error}`;
}

// checks to see if TTS is supported by the browser
if ('speechSynthesis' in window) {
  console.log("speechSynthesis Supported")
} else {
  console.log("speechSynthesis not Supported")
}

enableWebcamButton.addEventListener('click', enableCam);

//load cocossd model
var model = undefined;
cocoSsd.load().then(function(loadedModel) {
  model = loadedModel;
  // Show demo section now model is ready to use.
  console.log('model loaded!')
  notif.style.display = 'none';
});


// enable webcam & start classification
function enableCam(event) {
  //clear out stuff from image object detection
  subtitle.style.display = 'none';
  uploadedImage.style.display = 'none';
  canvas.style.display = 'none';
  // ensure model loaded
  if (!model) {
    return;
  }

  //enable webcam & classify
  if (event.target.innerHTML == 'Enable Webcam') {
    event.target.innerHTML = 'Disable Webcam';
    liveView.style.display = 'flex';
    displayImg.style.display = 'none';

    // activate webcam stream
    // get user media is a function that can access the web cam (it's an API         but its built in)
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(function(stream) {
      video.srcObject = stream;
      video.addEventListener('loadeddata', predictWebcam);
    });

    //disable webcam & hide videostream
  } else {
    event.target.innerHTML = 'Enable Webcam';
    liveView.style.display = 'none';
    displayImg.style.display = 'block';
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(function(stream) {
      video.srcObject = stream;
      video.pause();
      video.srcObject = "";
      stream.stop();
    });
  }
}

//capitalize object name
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

//object detection for webcam video
var children = [];
function predictWebcam() {
  model.detect(video).then(function(predictions) {
    /* returns:
    bbox: [x, y, width, height         
    class: "person         
    score: 0.83802825212478       },         
    bbox: [x, y, width, height         
    class: "kite         
    score: 0.746441532671451       
    }] */
    for (let n = 0; n < predictions.length; n++) {
      //remove previous highlighting/labeling 
      for (let i = 0; i < children.length; i++) {
        liveView.removeChild(children[i]);
      }
      children = [];

      // check if over 70% confident in prediction -> label if so
      if (predictions[n].score > 0.7) {
        object = predictions[n].class;
        predictionsTTS.text = `The Object is a ${predictions[n].class}`;
        //bounding box coordinates
        var x = predictions[n].bbox[0];
        var y = predictions[n].bbox[1];
        var w = predictions[n].bbox[2];
        var h = predictions[n].bbox[3];

        //write label
        const p = document.createElement('p');
        p.innerText = predictions[n].class + ': '
          + Math.round(parseFloat(predictions[n].score) * 100)
          + '% confidence.';
        p.style = 'margin-left: ' + (predictions[n].bbox[0] + 5) + 'px; margin-top: '
          + (predictions[n].bbox[1] + 10) + 'px; width: '
          + (predictions[n].bbox[2] - 0) + 'px; top: 0; left: 0;';
        liveView.appendChild(p); //adds predictions to html 
        children.push(p);

        //highlight bounding box
        const highlighter = document.createElement('div');
        highlighter.setAttribute('class', 'highlighter');
        highlighter.style = 'left: ' + x + 'px; top: '
          + y + 'px; width: '
          + w + 'px; height: '
          + h + 'px;';
        liveView.appendChild(highlighter);
        children.push(highlighter);
      }
    }
    //classify next frame after 2s
    setTimeout(window.requestAnimationFrame(predictWebcam), 2000);
  });
};

//text to speech 
buttonTTS.addEventListener("click", () => {
  console.log('logging ' + predictionsTTS.text)
  window.speechSynthesis.speak(predictionsTTS);
});

