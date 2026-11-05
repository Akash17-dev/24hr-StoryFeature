const storiesList = document.getElementById("storiesList");
const addStoryButton = document.getElementById("addStory");
const imageInput = document.getElementById("imageInput");
const emptyMessage = document.getElementById("emptyMessage");
const storyCount = document.getElementById("storyCount");
const storyViewer = document.getElementById("storyViewer");
const viewerImage = document.getElementById("viewerImage");
const viewerTime = document.getElementById("viewerTime");
const progressBars = document.getElementById("progressBars");
const oneDay = 24 * 60 * 60 * 1000;
const storageName = "daylightStories";
let stories = [];
let currentStory = 0;
let touchStartX = 0;
let storyTimer;
const storyDuration = 3000;

function loadStories() {
    const savedStories = localStorage.getItem(storageName);

    if (savedStories) {
        stories = JSON.parse(savedStories);
    }

    const now = Date.now();
    stories = stories.filter(function (story) {
        return now - story.createdAt < oneDay;
    });

    saveStories();
    showStories();
}

function saveStories() {
    localStorage.setItem(storageName, JSON.stringify(stories));
}

function showStories() {
    const oldStories = document.querySelectorAll(".saved-story");
    oldStories.forEach(function (story) {
        story.remove();
    });

    stories.forEach(function (story, index) {
        const storyButton = document.createElement("button");
        storyButton.className = "story saved-story";
        storyButton.type = "button";
        storyButton.setAttribute("aria-label", "Open story " + (index + 1));

        const ring = document.createElement("span");
        ring.className = "story-ring";

        const image = document.createElement("img");
        image.className = "story-thumb";
        image.src = story.image;
        image.alt = "Story photo";
        ring.appendChild(image);

        const name = document.createElement("span");
        name.className = "story-name";
        name.textContent = "Your story";

        const time = document.createElement("span");
        time.className = "story-time";
        time.textContent = getTimeLabel(story.createdAt);

        storyButton.appendChild(ring);
        storyButton.appendChild(name);
        storyButton.appendChild(time);
        storyButton.addEventListener("click", function () {
            openStory(index);
        });
        storiesList.appendChild(storyButton);
    });

    emptyMessage.hidden = stories.length > 0;
    storyCount.textContent = stories.length + (stories.length === 1 ? " story" : " stories");
}

function getTimeLabel(createdAt) {
    const minutes = Math.floor((Date.now() - createdAt) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return minutes + "m ago";
    return Math.floor(minutes / 60) + "h ago";
}

function resizeImage(file, done) {
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
            done(canvas.toDataURL("image/jpeg", 0.9));
        };
        image.src = reader.result;
    };
    reader.readAsDataURL(file);
}

function openStory(index) {
    currentStory = index;
    storyViewer.classList.add("open");
    storyViewer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    showCurrentStory();
}

function showCurrentStory() {
    clearTimeout(storyTimer);
    if (currentStory < 0) currentStory = stories.length - 1;
    if (currentStory >= stories.length) currentStory = 0;

    viewerImage.src = stories[currentStory].image;
    viewerTime.textContent = getTimeLabel(stories[currentStory].createdAt);
    progressBars.innerHTML = "";
    stories.forEach(function (story, index) {
        const bar = document.createElement("span");
        bar.className = "progress-bar";
        if (index === currentStory) bar.classList.add("active");
        progressBars.appendChild(bar);
    });

    const activeBar = progressBars.children[currentStory];
    activeBar.style.setProperty("--story-duration", storyDuration + "ms");
    activeBar.classList.add("playing");

    storyTimer = setTimeout(function () {
        currentStory++;
        showCurrentStory();
    }, storyDuration);
}

function closeStory() {
    clearTimeout(storyTimer);
    storyViewer.classList.remove("open");
    storyViewer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

addStoryButton.addEventListener("click", function () {
    imageInput.click();
});

imageInput.addEventListener("change", function () {
    const file = imageInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        alert("Please choose an image file.");
        imageInput.value = "";
        return;
    }

    resizeImage(file, function (imageData) {
        stories.push({ image: imageData, createdAt: Date.now() });
        saveStories();
        showStories();
        imageInput.value = "";
    });
});

document.getElementById("closeViewer").addEventListener("click", closeStory);
document.getElementById("previousStory").addEventListener("click", function () {
    currentStory--;
    showCurrentStory();
});
document.getElementById("nextStory").addEventListener("click", function () {
    currentStory++;
    showCurrentStory();
});

storyViewer.addEventListener("click", function (event) {
    if (event.target === storyViewer) closeStory();
});

document.addEventListener("keydown", function (event) {
    if (!storyViewer.classList.contains("open")) return;
    if (event.key === "Escape") closeStory();
    if (event.key === "ArrowRight") {
        currentStory++;
        showCurrentStory();
    }
    if (event.key === "ArrowLeft") {
        currentStory--;
        showCurrentStory();
    }
});

storyViewer.addEventListener("touchstart", function (event) {
    touchStartX = event.changedTouches[0].screenX;
});

storyViewer.addEventListener("touchend", function (event) {
    const touchEndX = event.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 50) {
        currentStory++;
        showCurrentStory();
    } else if (touchEndX - touchStartX > 50) {
        currentStory--;
        showCurrentStory();
    }
});

loadStories();
