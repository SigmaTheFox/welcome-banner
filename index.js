const express = require("express");
const app = express();
const fetch = require("node-fetch");
const { createCanvas, loadImage, registerFont } = require("canvas");
const canvas = createCanvas(500, 200);
let ctx = canvas.getContext("2d");

registerFont("./impact.ttf", { family: "Impact" });

const bannerTemplate = "https://i.imgur.com/6v1EpTj.png";
let imgurToken = process.env.IMGURTOKEN;
let albumID = "BQy1UdR";

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';

    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

async function drawBanner(avatar, username) {
    const background = await loadImage(bannerTemplate);
    const userAvatar = await loadImage(avatar);

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.font = "25px Impact";
    ctx.fillStyle = "white";
    wrapText(ctx, username, 15, 40, 218, 25);
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 100, 80, 0, 2 * Math.PI);
    ctx.clip();
    ctx.drawImage(userAvatar, canvas.width - 180, 20, 160, 160);
    ctx.restore();

    let img = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    let json = await fetch("https://api.imgur.com/3/upload", {
        method: "post",
        body: JSON.stringify({
            "type": 'base64',
            "image": img,
            "album": albumID
        }),
        headers: { "Authorization": `Bearer ${imgurToken}`, 'Content-Type': 'application/json' }
    })
        .then(res => res.json())
        .catch(() => {
            return {
                status: 400,
                error: "There was an error while uploading the image to imgur."
            }
        })

    return {
        status: 200,
        link: json.data.link
    }
}

app.use(express.json())

app.get('/', (req, res) => res.send("a."));

app.post("/banner", (req, res) => {
    let avatarURL = req.body.avatarURL,
        userTag = req.body.userTag;

    if (!avatarURL) return res.status(400).send({
        status: 400,
        error: "Missing avatarURL in body"
    });
    if (typeof avatarURL !== "string") return res.status(400).send({
        status: 400,
        error: "The avatarURL has to be a String"
    });
    if (!userTag) return res.status(400).send({
        status: 400,
        error: "Missing userTag in body"
    });
    if (typeof userTag !== "string") return res.status(400).send({
        status: 400,
        error: "The userTag has to be a String"
    });

    drawBanner(avatarURL, userTag)
        .then(banner => {
            if (banner.status !== 200) return res.status(400).send({
                status: 400,
                error: "There was an error while uploading the image to imgur."
            })
            return res.status(200).send({
                status: 200,
                link: banner.link
            })
        })
})

app.listen(3000, () => {
    console.log("The server is listening to port 3000");
})