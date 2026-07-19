"use strict";


/* =========================================================
   Current year
========================================================= */

const currentYearElement = document.getElementById("current-year");

if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
}


/* =========================================================
   Generic interactive figure switcher
   Used by Trending and Patterns pages
========================================================= */

const figureButtons = document.querySelectorAll(
    ".context-link[data-figure]"
);

const figureIframe =
    document.getElementById("analysis-figure") ||
    document.getElementById("trending-figure");

const figureFrame =
    document.getElementById("analysis-figure-frame") ||
    document.querySelector(".interactive-figure-frame");

const figureTitle = document.getElementById("figure-title");
const figureLabel = document.getElementById("figure-label");
const figureDescription = document.getElementById(
    "figure-description"
);


if (figureButtons.length > 0 && figureIframe) {

    figureButtons.forEach((button) => {

        button.addEventListener("click", () => {

            const figureSource = button.dataset.figure;
            const title = button.dataset.title;
            const label = button.dataset.label;
            const description = button.dataset.description;
            const figureHeight = button.dataset.height;

            if (!figureSource) {
                return;
            }

            figureButtons.forEach((item) => {
                item.classList.remove("active");
                item.setAttribute("aria-selected", "false");
            });

            button.classList.add("active");
            button.setAttribute("aria-selected", "true");

            if (figureFrame) {
                figureFrame.classList.add("is-loading");
            }

            if (figureTitle && title) {
                figureTitle.textContent = title;
            }

            if (figureLabel && label) {
                figureLabel.textContent = label;
            }

            if (figureDescription && description) {
                figureDescription.textContent = description;
            }

            if (figureHeight) {
                const heightValue = `${figureHeight}px`;

                if (figureFrame) {
                    figureFrame.style.height = heightValue;
                    figureFrame.style.minHeight = heightValue;
                }

                figureIframe.style.height = heightValue;
            }

            figureIframe.title =
                `${label || "Interactive"} figure`;

            const separator = figureSource.includes("?") ? "&" : "?";
            figureIframe.src = `${figureSource}${separator}v=${Date.now()}`;
        });

    });

    figureIframe.addEventListener("load", () => {

        if (figureFrame) {
            figureFrame.classList.remove("is-loading");
        }

    });

}