const storiesList = document.getElementById("storiesList");
const imageInput = document.getElementById("imageInput");
const emptyMessage = document.getElementById("emptyMessage");
const storyCount = document.getElementById("storyCount");
const storyViewer = document.getElementById("storyViewer");
const viewerImage = document.getElementById("viewerImage");
const viewerTime = document.getElementById("viewerTime");
const progressBars = document.getElementById("progressBars");
const oneDay = 24 * 60 * 60 * 1000;
const storyDuration = 3000;
const storageName = "daylightStories";
let stories = [];
let currentStory = 0;
let touchStartX = 0;
let storyTimer;

function loadStories() {
    const savedStories = localStorage.getItem(storageName);

    if (savedStories) {
        stories = JSON.parse(savedStories);
    }

    const currentTime = Date.now();
    const freshStories = [];

    for (let i = 0; i < stories.length; i++) {
        if (currentTime - stories[i].createdAt < oneDay) {
            freshStories.push(stories[i]);
        }
    }

    stories = freshStories;
    saveStories();
    showStories();
}

function saveStories() {
    localStorage.setItem(storageName, JSON.stringify(stories));
}

function showStories() {
    storiesList.innerHTML = '<button id="addStory" class="story add-story" type="button" aria-label="Add a story"><span class="story-ring add-ring"><span class="add-photo">＋</span></span><span class="story-name">Your story</span><span class="story-time">Add a moment</span></button>';

    for (let i = 0; i < stories.length; i++) {
        const storyButton = '<button class="story saved-story" type="button" onclick="openStory(' + i + ')">' +
            '<span class="story-ring"><img class="story-thumb" src="' + stories[i].image + '" alt="Story photo"></span>' +
            '<span class="story-name">Your story</span>' +
            '<span class="story-time">' + getTimeLabel(stories[i].createdAt) + '</span>' +
            '</button>';
        storiesList.innerHTML += storyButton;
    }

    document.getElementById("addStory").onclick = function () {
        imageInput.click();
    };

    emptyMessage.hidden = stories.length > 0;
    storyCount.textContent = stories.length + (stories.length === 1 ? " story" : " stories");
}

function getTimeLabel(createdAt) {
    const minutes = Math.floor((Date.now() - createdAt) / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return minutes + "m ago";
    return Math.floor(minutes / 60) + "h ago";
}

function resizeImage(file) {
    const reader = new FileReader();

    reader.onload = function () {
        const image = new Image();

        image.onload = function () {
            const scale = Math.min(1, 1080 / image.width, 1920 / image.height);
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);

            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            stories.push({
                image: canvas.toDataURL("image/jpeg", 0.9),
                createdAt: Date.now()
            });

            saveStories();
            showStories();
            imageInput.value = "";
        };

        image.src = reader.result;
    };

    reader.readAsDataURL(file);
}

function openStory(index) {
    currentStory = index;
    storyViewer.className = "viewer open";
    storyViewer.ariaHidden = "false";
    document.body.style.overflow = "hidden";
    showCurrentStory();
}

function showCurrentStory() {
    clearTimeout(storyTimer);

    if (currentStory >= stories.length) {
        closeStory();
        return;
    }

    if (currentStory < 0) {
        currentStory = stories.length - 1;
    }

    viewerImage.src = stories[currentStory].image;
    viewerTime.textContent = getTimeLabel(stories[currentStory].createdAt);
    progressBars.innerHTML = "";

    for (let i = 0; i < stories.length; i++) {
        if (i === currentStory) {
            progressBars.innerHTML += '<span class="progress-bar active playing" style="--story-duration: ' + storyDuration + 'ms"></span>';
        } else if (i < currentStory) {
            progressBars.innerHTML += '<span class="progress-bar active"></span>';
        } else {
            progressBars.innerHTML += '<span class="progress-bar"></span>';
        }
    }

    storyTimer = setTimeout(function () {
        currentStory++;
        showCurrentStory();
    }, storyDuration);
}

function closeStory() {
    clearTimeout(storyTimer);
    storyViewer.className = "viewer";
    storyViewer.ariaHidden = "true";
    document.body.style.overflow = "";
}

function nextStory() {
    currentStory++;
    showCurrentStory();
}

function previousStory() {
    currentStory--;
    showCurrentStory();
}

imageInput.onchange = function () {
    const file = imageInput.files[0];

    if (!file) return;

    if (file.type.indexOf("image/") !== 0) {
        alert("Please choose an image file.");
        imageInput.value = "";
        return;
    }

    resizeImage(file);
};

document.getElementById("closeViewer").onclick = closeStory;
document.getElementById("previousStory").onclick = previousStory;
document.getElementById("nextStory").onclick = nextStory;

storyViewer.onclick = function (event) {
    if (event.target === storyViewer) closeStory();
};

document.onkeydown = function (event) {
    if (storyViewer.className !== "viewer open") return;
    if (event.key === "Escape") closeStory();
    if (event.key === "ArrowRight") nextStory();
    if (event.key === "ArrowLeft") previousStory();
};

storyViewer.ontouchstart = function (event) {
    touchStartX = event.changedTouches[0].screenX;
};

storyViewer.ontouchend = function (event) {
    const touchEndX = event.changedTouches[0].screenX;

    if (touchStartX - touchEndX > 50) nextStory();
    if (touchEndX - touchStartX > 50) previousStory();
};

loadStories();
