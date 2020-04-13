const Discord = require('discord.js');
const client = new Discord.Client();
const {promisify} = require('util');
const curl = new(require('curl-request'))();
var auth = require('./auth.json');
const cv = require('opencv4nodejs');
let request = require(`request`);
let fs = require(`fs`);
const path = require('path');
const inceptionModelPath = 'inception';
let tess = require('tesseract.js');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("Process images, made by awooy~");
});

const modelFile = path.resolve(inceptionModelPath, 'tensorflow_inception_graph.pb');
const classNamesFile = path.resolve(inceptionModelPath, 'imagenet_comp_graph_label_strings.txt');
if (!fs.existsSync(modelFile) || !fs.existsSync(classNamesFile)) {
  console.log('could not find inception model');
  throw new Error('exiting');
}

const classNames = fs.readFileSync(classNamesFile).toString().split('\n');
const net = cv.readNetFromTensorflow(modelFile);

function dream(url, message, loop, msg) {
    curl
        .setHeaders([
            auth.apiKey
        ])
        .setMultipartBody([{
            name: 'image',
            contents: url
        }])
        .post('https://api.deepai.org/api/deepdream')
        .then(({
            statusCode,
            body,
            headers
        }) => {
            if (loop < 3) {
                loop++;
                return dreamer(body.output_url, message, loop, msg);
            } else {
                return msg.edit(new Discord.RichEmbed().setColor('#0099ff').setTitle("Dreamified Image").setImage(body.output_url));
            }
        })
        .catch((e) => {
            console.log(e);
        });
}

function downloadPng(url){
    request.get(url)
        .on('error', console.error)
        .pipe(fs.createWriteStream('curImg.png'));
return "curImg.png";
}

function downloadJpg(url){
    request.get(url)
        .on('error', console.error)
        .pipe(fs.createWriteStream('curImg.jpg'));
return "curImg.jpg";
}

const dreamer = promisify(dream);
const downloader = promisify(downloadJpg);
const downloaderpng = promisify(downloadPng);

client.on("message", async message => {
    if (message.author.bot) return;
    if ((message.content.indexOf(auth.prefix) !== 0) && (message.content.indexOf(auth.Prefix) !== 0)) return;
    const args = message.content.slice(auth.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    console.log(command);
    if (command === 'ping') {
        message.reply('Pong!');
    }

    if(command === 'face'){

	let ext = "png";
	if(message.attachments.first()){
	if(message.attachments.first().filename.includes(`png`)){
	downloaderpng(message.attachments.first().url);
	}else if(message.attachments.first().filename.includes(`jpg`)){
	downloader(message.attachments.first().url);
	ext = "jpg"
	}
	else return message.channel.send("This bot can only process JPGs and PNGs right now");	
	await sleep(2000);
	
	let mat = cv.imread("curImg." + ext); //await downloader(message.attachments.first().url)

	let face = getFaceImage(mat);
	if(face == 0){
		return message.channel.send("No face detected");
	}
	cv.imwrite('curImg1.jpg', face);
	message.channel.send({
  		files: [{
    		attachment:'curImg1.jpg',
    		name:'face.jpg'
  	   }]
	});

	}
    }

    if(command === 'help'){
	message.channel.send("Prefix $:\nFace: Detect faces in images\nText: Detect and guess text in images using EAST OCR\nDetect: Image detection using TensorFlow Inception\nHot/cold: Apply rgb based filters\nGray/Grey: Grayscale image\nDream: Use google's deep dream ai to make the picture trippy");
    }

    if(command === 'text'){
	let x = 0;
	let msg = await message.channel.send("Processing...");
	let ext = "png";
	if(message.attachments.first()){
	if(message.attachments.first().filename.includes(`png`)){
	downloaderpng(message.attachments.first().url);
	}else if(message.attachments.first().filename.includes(`jpg`)){
	downloader(message.attachments.first().url);
	ext = "jpg"
	}
	else return message.channel.send("This bot can only process JPGs and PNGs right now");	
	await sleep(2000);
	
	tess.recognize("curImg." + ext)
	  .progress(progress => {
	    
	  }).then(result => {
	    msg.edit({
		embed: {
                color: 0xff2727,
                description: "**Prediction:** \n" +result.text
            }
	    });
	  });
	}
    }

    if(command === 'detect'){
	let ext = "png";
	if(message.attachments.first()){
	if(message.attachments.first().filename.includes(`png`)){
	downloaderpng(message.attachments.first().url);
	}else if(message.attachments.first().filename.includes(`jpg`)){
	downloader(message.attachments.first().url);
	ext = "jpg"
	}
	else return message.channel.send("This bot can only process JPGs and PNGs right now");	
	await sleep(2000);
	
	let mat = cv.imread("curImg." + ext); //await downloader(message.attachments.first().url)

	console.log("awoo");
	const predictions = classifyImg(mat);
	let msg = "";
  	predictions.forEach(p => msg+=p + "\n");
	message.channel.send({
		embed: {
                color: 0xff2727,
                description: "**Predictions:** \n" +msg
            }
	});
	}
    }

    if(command === 'hot'){
	let ext = "png";
	if(message.attachments.first()){
	if(message.attachments.first().filename.includes(`png`)){
	downloaderpng(message.attachments.first().url);
	}else if(message.attachments.first().filename.includes(`jpg`)){
	downloader(message.attachments.first().url);
	ext = "jpg"
	}
	else return message.channel.send("This bot can only process JPGs and PNGs right now");	
	await sleep(2000);
	
	let mat = cv.imread("curImg." + ext); //await downloader(message.attachments.first().url)

	console.log("awoo");
	mat = mat.cvtColor(cv.COLOR_BGR2HSV);

	cv.imwrite('curImg1.jpg', mat);
	
	message.channel.send({
  		files: [{
    		attachment:'curImg1.jpg',
    		name:'image.png'
  	   }]
	});
    }
}

    if(command === 'cold'){
	let ext = "png";
	if(message.attachments.first()){
	if(message.attachments.first().filename.includes(`png`)){
	downloaderpng(message.attachments.first().url);
	}else if(message.attachments.first().filename.includes(`jpg`)){
	downloader(message.attachments.first().url);
	ext = "jpg"
	}
	else return message.channel.send("This bot can only process JPGs and PNGs right now");	
	await sleep(2000);
	
	let mat = cv.imread("curImg." + ext); //await downloader(message.attachments.first().url)

	console.log("awoo");
	mat = mat.cvtColor(cv.COLOR_BGR2Lab);

	cv.imwrite('curImg1.jpg', mat);
	
	message.channel.send({
  		files: [{
    		attachment:'curImg1.jpg',
    		name:'image.png'
  	   }]
	});
    }
}


    if(command === 'grey' || command === 'gray'){
	let ext = "png";
	if(message.attachments.first()){
	if(message.attachments.first().filename.includes(`png`)){
	downloaderpng(message.attachments.first().url);
	}else if(message.attachments.first().filename.includes(`jpg`)){
	downloader(message.attachments.first().url);
	ext = "jpg"
	}
	else return message.channel.send("This bot can only process JPGs and PNGs right now");	
	await sleep(2000);
	
	let mat = cv.imread("curImg." + ext); //await downloader(message.attachments.first().url)

	console.log("awoo");
	mat = mat.bgrToGray();

	cv.imwrite('curImg1.jpg', mat);
	
	message.channel.send({
  		files: [{
    		attachment:'curImg1.jpg',
    		name:'image.png'
  	   }]
	});
    }
}
    if (command === 'dream') {
        if (!message.attachments.first()) {
            return message.channel.send("Please attach an image to process");
        } else {
            await dreamer(message.attachments.first().url, message, 0, await message.channel.send("Processing..."));

        }
    }
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const getFaceImage = (img, msg) => {
  const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);
  const faceRects = classifier.detectMultiScale(img).objects;
  if (!faceRects.length) {
     return 0;
  }
  return img.getRegion(faceRects[0]);
};


const classifyImg = (img) => {
  const maxImgDim = 224;
  const white = new cv.Vec(255, 255, 255);
  const imgResized = img.resizeToMax(maxImgDim).padToSquare(white);

  const inputBlob = cv.blobFromImage(imgResized);
  net.setInput(inputBlob);

  const outputBlob = net.forward();

  const minConfidence = 0.05;
  const locations =
    outputBlob
      .threshold(minConfidence, 1, cv.THRESH_BINARY)
      .convertTo(cv.CV_8U)
      .findNonZero();

  const result =
    locations.map(pt => ({
      confidence: parseInt(outputBlob.at(0, pt.x) * 100) / 100,
      className: classNames[pt.x]
    }))
      .sort((r0, r1) => r1.confidence - r0.confidence)
      .map(res => `${res.className} (${res.confidence})`);

  return result;
};

client.login(auth.token);
