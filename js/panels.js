"use strict";

const TEMPORAL_DOMAIN_COLORS = {
    "Inorganics & elements": "#4C72B0",
    "Nutrients & eutrophication": "#6BAED6",
    "Biological contaminants": "#DD8452",
    "Radionuclides": "#8A7AAE",
    "Endocrine-active compounds": "#CCB974",
    "Atmospheric pollutants & particles": "#55A868",

    "PFAS & organofluorine": "#937860",
    "Halogenated organics & POPs": "#E1A95F",
    "PPCPs": "#DA8BC3",
    "Pesticides & biocides": "#64B5CD",
    "Disinfection byproducts": "#C44E52",

    "Hydrocarbons & petroleum": "#4C8C7A",
    "Surfactants & detergents": "#8C8C8C",
    "Consumer chemicals": "#C97B9F",
    "Plastics & polymeric materials": "#B55D4C",
    "Engineered nanomaterials": "#7A9E4B",

    "Non-halogenated organic compounds": "#8172B2",
    "Contextual environmental terms": "#A89C94"
};



/* =========================================================
   Main Panels-page elements
========================================================= */

const panelTabButtons = document.querySelectorAll(
    ".panels-tab-button[data-panels-view]"
);

const panelViews = document.querySelectorAll(
    ".panels-view-panel"
);

const overviewPanel = document.getElementById(
    "panels-overview-view"
);

const panelGrid = document.getElementById(
    "panel-sunburst-grid"
);

const expandedPanelView = document.getElementById(
    "expanded-panel-view"
);

const expandedPanelFigure = document.getElementById(
    "expanded-panel-figure"
);

const panelBackButton = document.getElementById(
    "panel-back-button"
);


/* =========================================================
   Expanded-view heading elements
========================================================= */

const expandedPanelNumber = document.getElementById(
    "expanded-panel-number"
);

const expandedPanelTitle = document.getElementById(
    "expanded-panel-title"
);

const expandedPanelDomains = document.getElementById(
    "expanded-panel-domains"
);


/* =========================================================
   Expanded-view information elements
========================================================= */

const expandedInformationName = document.getElementById(
    "expanded-information-name"
);

const expandedInformationPath = document.getElementById(
    "expanded-information-path"
);

const expandedInformationLevel = document.getElementById(
    "expanded-information-level"
);

const expandedInformationFrequency = document.getElementById(
    "expanded-information-frequency"
);

const expandedInformationParentShare = document.getElementById(
    "expanded-information-parent-share"
);

const expandedInformationPanelShare = document.getElementById(
    "expanded-information-panel-share"
);

const expandedInformationSubcategories = document.getElementById(
    "expanded-information-subcategories"
);


/* =========================================================
   Expanded-view state
========================================================= */

let expandedPanelId = null;

let expandedIframe = null;

let originalIframeFrame = null;


/* =========================================================
   Interaction state for each panel

   last:
       Most recently hovered sector.

   pinned:
       Most recently clicked sector.
========================================================= */

const panelInteractionState = {};


/* =========================================================
   Default information
========================================================= */

function getDefaultInformation() {
    return {
        name: "Hover over a sector",
        path: "Classification details will appear here.",
        hierarchyLevel: null,
        frequency: null,
        parentShare: null,
        panelShare: null,
        subcategoryCount: null
    };
}


/* =========================================================
   Number formatting
========================================================= */

function formatNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return "—";
    }

    return numericValue.toLocaleString(
        undefined,
        {
            maximumFractionDigits: 2
        }
    );
}


function formatPercentage(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return "—";
    }

    return (
        numericValue.toFixed(1)
        + "%"
    );
}


function formatHierarchyLevel(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return "—";
    }

    return (
        "Level "
        + Math.round(numericValue)
    );
}


function formatSubcategoryCount(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return "—";
    }

    const roundedValue = Math.round(
        numericValue
    );

    if (roundedValue === 0) {
        return "None";
    }

    return roundedValue.toLocaleString();
}


/* =========================================================
   Initialize state for one panel
========================================================= */

function ensurePanelState(panelId) {
    if (!panelInteractionState[panelId]) {
        panelInteractionState[panelId] = {
            last: null,
            pinned: null
        };
    }

    return panelInteractionState[panelId];
}


/* =========================================================
   Load panel iframes lazily
========================================================= */

function loadPanelSunbursts(container) {
    if (!container) {
        return;
    }

    const iframes = container.querySelectorAll(
        ".panel-sunburst-iframe[data-src]"
    );

    iframes.forEach((iframe) => {
        const currentSrc = iframe.getAttribute(
            "src"
        );

        if (
            currentSrc &&
            currentSrc.trim() !== ""
        ) {
            return;
        }

        const source = iframe.dataset.src;

        if (!source) {
            return;
        }

        iframe.src = source;
    });
}


/* =========================================================
   Send Plotly a resize request
========================================================= */

function sendResizeMessage(
    iframe,
    delay = 0
) {
    if (!iframe) {
        return;
    }

    window.setTimeout(
        () => {
            if (!iframe.contentWindow) {
                return;
            }

            iframe.contentWindow.postMessage(
                {
                    type:
                        "panel-sunburst-resize"
                },
                "*"
            );

            /*
             Dispatching a browser resize event provides a
             second fallback for Plotly.
            */
            try {
                iframe.contentWindow.dispatchEvent(
                    new Event("resize")
                );
            } catch (error) {
                /*
                 Cross-origin or browser restrictions can prevent
                 direct event dispatch. postMessage remains active.
                */
            }
        },
        delay
    );
}


/* =========================================================
   Resize one iframe several times
========================================================= */

function resizePanelIframe(iframe) {
    if (!iframe) {
        return;
    }

    sendResizeMessage(
        iframe,
        20
    );

    sendResizeMessage(
        iframe,
        120
    );

    sendResizeMessage(
        iframe,
        300
    );

    sendResizeMessage(
        iframe,
        600
    );
}


/* =========================================================
   Resize all visible panel iframes
========================================================= */

function resizeVisiblePanelSunbursts(container) {
    if (!container) {
        return;
    }

    const iframes = container.querySelectorAll(
        ".panel-sunburst-iframe"
    );

    iframes.forEach((iframe) => {
        resizePanelIframe(
            iframe
        );
    });
}


/* =========================================================
   Normalize information sent from Plotly
========================================================= */

function normalizeInformation(information) {
    const source =
        information &&
        typeof information === "object"
            ? information
            : {};

    return {
        name:
            source.name
            || source.label
            || "Unknown category",

        path:
            source.path
            || source.hierarchy
            || source.hierarchyPath
            || source.name
            || "Unknown category",

        hierarchyLevel:
            source.hierarchyLevel
            ?? source.hierarchy_level
            ?? source.level
            ?? null,

        frequency:
            source.frequency
            ?? source.value
            ?? null,

        parentShare:
            source.parentShare
            ?? source.parent_share
            ?? source.shareOfParent
            ?? null,

        panelShare:
            source.panelShare
            ?? source.panel_share
            ?? source.shareOfPanel
            ?? null,

        subcategoryCount:
            source.subcategoryCount
            ?? source.subcategory_count
            ?? source.childCount
            ?? source.childrenCount
            ?? null
    };
}


/* =========================================================
   Expanded right-side information panel
========================================================= */

function updateExpandedInformation(
    information
) {
    const resolvedInformation =
        information
        || getDefaultInformation();


    if (expandedInformationName) {
        expandedInformationName.textContent =
            resolvedInformation.name
            || "Hover over a sector";
    }


    if (expandedInformationPath) {
        expandedInformationPath.textContent =
            resolvedInformation.path
            || "Classification details will appear here.";
    }


    if (expandedInformationLevel) {
        expandedInformationLevel.textContent =
            formatHierarchyLevel(
                resolvedInformation.hierarchyLevel
            );
    }


    if (expandedInformationFrequency) {
        expandedInformationFrequency.textContent =
            formatNumber(
                resolvedInformation.frequency
            );
    }


    if (expandedInformationParentShare) {
        expandedInformationParentShare.textContent =
            formatPercentage(
                resolvedInformation.parentShare
            );
    }


    if (expandedInformationPanelShare) {
        expandedInformationPanelShare.textContent =
            formatPercentage(
                resolvedInformation.panelShare
            );
    }


    if (expandedInformationSubcategories) {
        expandedInformationSubcategories.textContent =
            formatSubcategoryCount(
                resolvedInformation.subcategoryCount
            );
    }
}


/* =========================================================
   Expand one panel
========================================================= */

function expandPanel(panelId) {
    if (
        !panelGrid
        ||
        !expandedPanelView
        ||
        !expandedPanelFigure
    ) {
        return;
    }

    /*
     If another panel is already expanded, collapse it first.
    */
    if (
        expandedPanelId
        &&
        expandedPanelId !== panelId
    ) {
        collapseExpandedPanel({
            scrollToCard: false
        });
    }

    const card = document.querySelector(
        `.panel-sunburst-card[data-panel-id="${panelId}"]`
    );

    if (!card) {
        return;
    }

    const iframe = card.querySelector(
        ".panel-sunburst-iframe"
    );

    const iframeFrame = card.querySelector(
        ".panel-sunburst-frame"
    );

    if (
        !iframe
        ||
        !iframeFrame
    ) {
        return;
    }

    loadPanelSunbursts(
        card
    );

    expandedPanelId = panelId;

    expandedIframe = iframe;

    originalIframeFrame =
        iframeFrame;


    if (expandedPanelNumber) {
        expandedPanelNumber.textContent =
            card.dataset.panelNumber
            || panelId.replace(
                "_",
                " "
            );
    }


    if (expandedPanelTitle) {
        expandedPanelTitle.textContent =
            card.dataset.panelTitle
            || "Panel classification";
    }


    if (expandedPanelDomains) {
        expandedPanelDomains.textContent =
            card.dataset.panelDomains
            || "";
    }


    /*
     Move the existing iframe rather than reloading it.
    */
    expandedPanelFigure.appendChild(
        iframe
    );


    panelGrid.hidden = true;

    expandedPanelView.hidden = false;


    if (overviewPanel) {
        overviewPanel.classList.add(
            "panel-is-expanded"
        );
    }


    const panelState =
        ensurePanelState(
            panelId
        );

    updateExpandedInformation(
        panelState.pinned
        || panelState.last
        || getDefaultInformation()
    );


    expandedPanelView.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    /*
     Resize after moving the iframe into the larger container.
    */
    resizePanelIframe(
        iframe
    );
}


/* =========================================================
   Return to four-panel overview
========================================================= */

function collapseExpandedPanel({
    scrollToCard = true
} = {}) {
    if (
        !expandedPanelId
        ||
        !expandedIframe
        ||
        !originalIframeFrame
    ) {
        return;
    }

    const previousPanelId =
        expandedPanelId;

    const previousIframe =
        expandedIframe;

    const previousCard =
        document.querySelector(
            `.panel-sunburst-card[data-panel-id="${previousPanelId}"]`
        );


    /*
     Return iframe to its original card.
    */
    originalIframeFrame.appendChild(
        previousIframe
    );


    if (expandedPanelView) {
        expandedPanelView.hidden = true;
    }


    if (panelGrid) {
        panelGrid.hidden = false;
    }


    if (overviewPanel) {
        overviewPanel.classList.remove(
            "panel-is-expanded"
        );
    }


    expandedPanelId = null;

    expandedIframe = null;

    originalIframeFrame = null;


    /*
     Resize after returning to the smaller card.
    */
    resizePanelIframe(
        previousIframe
    );


    if (
        scrollToCard
        &&
        previousCard
    ) {
        previousCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}


/* =========================================================
   Expand buttons
========================================================= */

document.querySelectorAll(
    ".panel-expand-button[data-expand-panel]"
).forEach((button) => {
    button.addEventListener(
        "click",
        () => {
            const panelId =
                button.dataset.expandPanel;

            if (!panelId) {
                return;
            }

            expandPanel(
                panelId
            );
        }
    );
});


/* =========================================================
   Back button
========================================================= */

if (panelBackButton) {
    panelBackButton.addEventListener(
        "click",
        () => {
            collapseExpandedPanel();
        }
    );
}


/* =========================================================
   Escape key closes expanded panel
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key === "Escape"
            &&
            expandedPanelId
        ) {
            collapseExpandedPanel();
        }
    }
);


/* =========================================================
   Find which iframe sent a postMessage event
========================================================= */

function findPanelIframeByWindow(
    sourceWindow
) {
    const iframes =
        document.querySelectorAll(
            ".panel-sunburst-iframe"
        );

    for (const iframe of iframes) {
        if (
            iframe.contentWindow
            === sourceWindow
        ) {
            return iframe;
        }
    }

    return null;
}


/* =========================================================
   Receive Plotly hover and click messages
========================================================= */

window.addEventListener(
    "message",
    (event) => {
        const message =
            event.data;

        if (
            !message
            ||
            message.type
                !==
                "panel-sunburst-interaction"
        ) {
            return;
        }

        const sourceIframe =
            findPanelIframeByWindow(
                event.source
            );

        if (!sourceIframe) {
            return;
        }

        /*
         Prefer data-panel-id on the iframe.

         If it is absent, obtain it from the parent card.
        */
        let panelId =
            sourceIframe.dataset.panelId;

        if (!panelId) {
            const sourceCard =
                sourceIframe.closest(
                    ".panel-sunburst-card"
                );

            if (sourceCard) {
                panelId =
                    sourceCard.dataset.panelId;
            }
        }

        /*
         When the iframe is currently inside the expanded
         container, closest(".panel-sunburst-card") will not work.
         Use expandedPanelId as the final fallback.
        */
        if (
            !panelId
            &&
            sourceIframe === expandedIframe
        ) {
            panelId =
                expandedPanelId;
        }

        if (!panelId) {
            return;
        }

        const state =
            ensurePanelState(
                panelId
            );


        if (
            message.action === "unhover"
        ) {
            const restoredInformation =
                state.pinned
                || getDefaultInformation();

            if (
                expandedPanelId === panelId
            ) {
                updateExpandedInformation(
                    restoredInformation
                );
            }

            return;
        }


        const information =
            normalizeInformation(
                message.information
            );


        if (
            message.action === "hover"
        ) {
            state.last =
                information;

            if (
                expandedPanelId === panelId
            ) {
                updateExpandedInformation(
                    information
                );
            }

            return;
        }


        if (
            message.action === "click"
        ) {
            state.pinned =
                information;

            state.last =
                information;

            if (
                expandedPanelId === panelId
            ) {
                updateExpandedInformation(
                    information
                );
            }
        }
    }
);


/* =========================================================
   Panels-page tab switching
========================================================= */

panelTabButtons.forEach((button) => {
    button.addEventListener(
        "click",
        () => {
            const targetId =
                button.dataset.panelsView;

            const targetPanel =
                document.getElementById(
                    targetId
                );

            if (!targetPanel) {
                return;
            }


            /*
             Exit expanded mode before switching away from
             the Overview tab.
            */
            if (
                targetId
                    !==
                    "panels-overview-view"
                &&
                expandedPanelId
            ) {
                collapseExpandedPanel({
                    scrollToCard: false
                });
            }


            panelTabButtons.forEach(
                (item) => {
                    item.classList.remove(
                        "active"
                    );

                    item.setAttribute(
                        "aria-selected",
                        "false"
                    );
                }
            );


            panelViews.forEach(
                (panel) => {
                    panel.classList.remove(
                        "active"
                    );

                    panel.hidden = true;
                }
            );


            button.classList.add(
                "active"
            );

            button.setAttribute(
                "aria-selected",
                "true"
            );


            targetPanel.hidden = false;

            targetPanel.classList.add(
                "active"
            );


            if (
                targetId
                    ===
                    "panels-overview-view"
            ) {
                loadPanelSunbursts(
                    targetPanel
                );

                resizeVisiblePanelSunbursts(
                    targetPanel
                );
            }

            if (
                targetId
                    ===
                    "panels-temporal-view"
                &&
                typeof Plotly !== "undefined"
            ) {
                /*
                 The Temporal tab is hidden during initial page load.
                 Rendering Plotly while its container is hidden can
                 produce an incorrect first-pass legend position.

                 Redraw both figures only after the tab is visible and
                 the browser has completed layout.
                */
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        refreshTemporalView();
                    });
                });
            }
        }
    );
});


/* =========================================================
   Resize visible charts when browser size changes
========================================================= */

let panelResizeTimer = null;

window.addEventListener(
    "resize",
    () => {
        window.clearTimeout(
            panelResizeTimer
        );

        panelResizeTimer =
            window.setTimeout(
                () => {
                    if (
                        expandedPanelId
                        &&
                        expandedIframe
                    ) {
                        resizePanelIframe(
                            expandedIframe
                        );

                        return;
                    }

                    if (
                        overviewPanel
                        &&
                        !overviewPanel.hidden
                    ) {
                        resizeVisiblePanelSunbursts(
                            overviewPanel
                        );
                    }
                },
                100
            );
    }
);


/* =========================================================
   Resize after every iframe finishes loading
========================================================= */

document.querySelectorAll(
    ".panel-sunburst-iframe"
).forEach((iframe) => {
    iframe.addEventListener(
        "load",
        () => {
            resizePanelIframe(
                iframe
            );
        }
    );
});


/* =========================================================
   Initial setup
========================================================= */

if (overviewPanel) {
    loadPanelSunbursts(
        overviewPanel
    );

    window.setTimeout(
        () => {
            resizeVisiblePanelSunbursts(
                overviewPanel
            );
        },
        150
    );
}








/* =========================================================
   Temporal page elements
========================================================= */

const temporalPage = document.getElementById(
    "panels-temporal-view"
);

const temporalDomainPlot = document.getElementById(
    "temporal-domain-plot"
);

const temporalTopicPlot = document.getElementById(
    "temporal-topic-plot"
);

const temporalStatus = document.getElementById(
    "temporal-status"
);

const temporalError = document.getElementById(
    "temporal-error"
);

const domainPlotLoading = document.getElementById(
    "domain-plot-loading"
);

const topicPlotLoading = document.getElementById(
    "topic-plot-loading"
);

const selectedPanelName = document.getElementById(
    "selected-panel-name"
);

const selectedDomainName = document.getElementById(
    "selected-domain-name"
);

const allTopicsNote = document.getElementById(
    "all-topics-note"
);

const temporalTopicTitle = document.getElementById(
    "temporal-topic-title"
);

const temporalTopicSubtitle = document.getElementById(
    "temporal-topic-subtitle"
);

const panelButtons = document.querySelectorAll(
    ".temporal-control-button[data-temporal-panel]"
);

const frequencyButtons = document.querySelectorAll(
    ".temporal-control-button[data-temporal-frequency]"
);

const topicButtons = document.querySelectorAll(
    ".temporal-control-button[data-topic-count]"
);


/* =========================================================
   Temporal state
========================================================= */

const temporalState = {

    panel: "Panel 1",

    frequency: "normalized",

    topicCount: 10,

    selectedDomain: null,

    domainData: null,

    topicData: null

};


/* =========================================================
   Load temporal JSON
========================================================= */

async function loadTemporalData() {

    const [
        domainResponse,
        topicResponse
    ] = await Promise.all([

        fetch("../data/panel_temporal_domains.json"),

        fetch("../data/panel_temporal_topics.json")

    ]);

    if (!domainResponse.ok) {
        throw new Error(
            "Unable to load panel_temporal_domains.json"
        );
    }

    if (!topicResponse.ok) {
        throw new Error(
            "Unable to load panel_temporal_topics.json"
        );
    }

    temporalState.domainData =
        await domainResponse.json();

    temporalState.topicData =
        await topicResponse.json();
    

    /* =========================================================
    Preprocess temporal JSON
    ========================================================= */

    function preprocessTemporalData() {

        Object.values(
            temporalState.domainData
        ).forEach((panel) => {

            Object.entries(
                panel.domains
            ).forEach(([domainName, records]) => {

                records.forEach((record) => {

                    record.domain = domainName;

                    record.topics = [];

                    if (
                        record.topic_names &&
                        record.topic_frequencies
                    ) {

                        record.topic_names.forEach((name, i) => {

                            record.topics.push({

                                name: name,

                                frequency:
                                    record.topic_frequencies[i]

                            });

                        });

                    }

                    const preview =
                        record.topics
                            .slice(0,3)
                            .map(item=>item.name);

                    if(record.topics.length>3){

                        preview.push(
                            `(+${record.topics.length-3} more)`
                        );

                    }

                    record.hoverTopics =
                        preview.join("<br>");

                });

            });

        });

    }

    preprocessTemporalData();
}


/* =========================================================
   Active buttons
========================================================= */

function updateTemporalButtons() {

    panelButtons.forEach((button) => {
        const isActive =
            button.dataset.temporalPanel
            ===
            temporalState.panel;

        button.classList.toggle(
            "is-active",
            isActive
        );

        button.setAttribute(
            "aria-pressed",
            String(isActive)
        );
    });


    frequencyButtons.forEach((button) => {
        const isActive =
            button.dataset.temporalFrequency
            ===
            temporalState.frequency;

        button.classList.toggle(
            "is-active",
            isActive
        );

        button.setAttribute(
            "aria-pressed",
            String(isActive)
        );
    });


    topicButtons.forEach((button) => {
        const buttonValue =
            button.dataset.topicCount;

        const isActive =
            buttonValue === "all"
                ? temporalState.topicCount === "all"
                : Number(buttonValue) === temporalState.topicCount;

        button.classList.toggle(
            "is-active",
            isActive
        );

        button.setAttribute(
            "aria-pressed",
            String(isActive)
        );
    });

}



/* =========================================================
   Initialize controls
========================================================= */

function initializeTemporalControls() {

    panelButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                temporalState.panel =
                    button.dataset.temporalPanel;

                temporalState.selectedDomain =
                    null;

                updateTemporalButtons();

                refreshTemporalView();

            }
        );

    });


    frequencyButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                temporalState.frequency =
                    button.dataset.temporalFrequency;

                updateTemporalButtons();

                refreshTemporalView();

            }
        );

    });


    topicButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const topicCountValue =
                    button.dataset.topicCount;

                temporalState.topicCount =
                    topicCountValue === "all"
                        ? "all"
                        : Number(topicCountValue);

                updateTemporalButtons();

                updateTopicHeading();

                renderTopicFigure();

            }
        );

    });

}


/* =========================================================
   Update topic heading
========================================================= */

function updateTopicHeading() {

    if (selectedPanelName) {
        selectedPanelName.textContent =
            temporalState.panel;
    }

    if (selectedDomainName) {
        selectedDomainName.textContent =
            temporalState.selectedDomain
                || "Select a domain";
    }

    if (allTopicsNote) {
        allTopicsNote.hidden =
            temporalState.topicCount !== "all";
    }

    if (temporalTopicSubtitle) {
        temporalTopicSubtitle.textContent =
            temporalState.selectedDomain
                ? temporalState.selectedDomain
                    + " • Annual observations"
                : "Select a domain above • Annual observations";
    }

}



/* =========================================================
   Refresh page
========================================================= */

function refreshTemporalView() {

    updateTopicHeading();

    renderDomainFigure();

    renderTopicFigure();

}


/* =========================================================
   Placeholder render functions
========================================================= */

function renderDomainFigure(){

    if(
        !temporalDomainPlot ||
        !temporalState.domainData ||
        typeof Plotly === "undefined"
    ){
        return;
    }

    const panel =
        temporalState.domainData[
            temporalState.panel
        ];

    if(!panel){
        return;
    }

    const traces=[];

    Object.entries(
        panel.domains
    ).forEach(([domainName,records])=>{

        const x=[];

        const y=[];

        const custom=[];

        records.forEach((r)=>{

            x.push(
                r.current_start_year
            );

            y.push(

                temporalState.frequency==="normalized"

                ?

                r.current_normalized_frequency

                :

                r.current_absolute_frequency

            );

            custom.push([

                r.window_id,

                r.current_absolute_frequency,

                r.current_normalized_frequency,

                r.trend_factor,

                r.current_countries_regions,

                r.num_topics,

                r.hoverTopics

            ]);

        });

        const selected=
            temporalState.selectedDomain===domainName;

        traces.push({

            type:"scatter",

            mode:"lines",

            name:domainName,

            x:x,

            y:y,

            customdata:custom,

            line:{

                color:
                    TEMPORAL_DOMAIN_COLORS[domainName]
                    || "#4C72B0",

                width:selected?5:2

            },

            opacity:
                temporalState.selectedDomain
                    ?(selected?1:0.25)
                    :1,

            hovertemplate:

            "<b>%{fullData.name}</b><br><br>"

            +"Window: %{customdata[0]}<br>"

            +(temporalState.frequency==="normalized"

            ?"Normalized frequency: %{customdata[2]:.2f}<br>"

            :"Absolute frequency: %{customdata[1]}<br>")

            +"Trend factor: %{customdata[3]:.3f}<br>"

            +"Countries/regions: %{customdata[4]}<br>"

            +"Representative topics: %{customdata[5]}<br><br>"

            +"%{customdata[6]}"

            +"<extra></extra>"

        });

    });

    const layout={

        title:{
            text:
                panel.title,
            x:0
        },

        paper_bgcolor:"white",

        plot_bgcolor:"white",

        hovermode:"closest",

        hoverdistance:10,

        margin:{
            l:70,
            r:30,
            t:60,
            b:100
        },

        xaxis:{

            title:"Current rolling window start year",

            showgrid:true,

            zeroline:false

        },

        yaxis:{

            title:

                temporalState.frequency==="normalized"

                ?

                "Normalized frequency (per 1000 papers)"

                :

                "Absolute frequency",

            showgrid:true,

            zeroline:false

        },

        legend:{

            orientation:"h",

            y:-0.25

        }

    };

    Plotly.react(

        temporalDomainPlot,

        traces,

        layout,

        {

            responsive:true,

            displaylogo:false

        }

    );

    if (domainPlotLoading) {
        domainPlotLoading.hidden = true;
    }

    temporalDomainPlot.removeAllListeners(
        "plotly_click"
    );

    temporalDomainPlot.on(

        "plotly_click",

        function(event){

            if(
                !event.points.length
            ){
                return;
            }

            const domain=

                event.points[0].data.name;

            if(
                temporalState.selectedDomain
                ===
                domain
            ){

                temporalState.selectedDomain=null;

            }

            else{

                temporalState.selectedDomain=
                    domain;

            }

            updateTopicHeading();

            renderDomainFigure();

            renderTopicFigure();

        }

    );

}


function renderTopicFigure() {
    if (
        !temporalTopicPlot
        ||
        !temporalState.topicData
        ||
        typeof Plotly === "undefined"
    ) {
        return;
    }

    const selectedPanel =
        temporalState.panel;

    const selectedDomain =
        temporalState.selectedDomain;

    const selectedMetric =
        temporalState.frequency;

    const requestedTopicCount =
        temporalState.topicCount;


    /*
     Update the heading or selected-domain label maintained
     elsewhere in panels.js.
    */
    if (
        typeof updateTopicHeading
        ===
        "function"
    ) {
        updateTopicHeading();
    }


    /*
     Empty state before the user selects a domain.
    */
    if (!selectedDomain) {
        Plotly.react(
            temporalTopicPlot,
            [],
            {
                autosize: true,

                margin: {
                    l: 56,
                    r: 28,
                    t: 28,
                    b: 56
                },

                paper_bgcolor:
                    "rgba(0, 0, 0, 0)",

                plot_bgcolor:
                    "rgba(0, 0, 0, 0)",

                xaxis: {
                    visible: false,
                    fixedrange: true
                },

                yaxis: {
                    visible: false,
                    fixedrange: true
                },

                annotations: [
                    {
                        x: 0.5,
                        y: 0.5,

                        xref: "paper",
                        yref: "paper",

                        text:
                            "Select a domain in the upper figure "
                            +
                            "to display its topic trajectories.",

                        showarrow: false,

                        align: "center",

                        font: {
                            family:
                                "Arial, Helvetica, sans-serif",
                            size: 16,
                            color: "#65706c"
                        }
                    }
                ]
            },
            {
                responsive: true,
                displaylogo: false
            }
        );

        if (topicPlotLoading) {
            topicPlotLoading.hidden = true;
        }

        return;
    }


    const panelData =
        temporalState.topicData.panels
        &&
        temporalState.topicData.panels[
            selectedPanel
        ];

    const domainTopics =
        panelData
        &&
        panelData.domains
        &&
        panelData.domains[
            selectedDomain
        ];


    /*
     Empty state for missing panel/domain data.
    */
    if (
        !Array.isArray(domainTopics)
        ||
        domainTopics.length === 0
    ) {
        Plotly.react(
            temporalTopicPlot,
            [],
            {
                autosize: true,

                margin: {
                    l: 56,
                    r: 28,
                    t: 28,
                    b: 56
                },

                paper_bgcolor:
                    "rgba(0, 0, 0, 0)",

                plot_bgcolor:
                    "rgba(0, 0, 0, 0)",

                xaxis: {
                    visible: false,
                    fixedrange: true
                },

                yaxis: {
                    visible: false,
                    fixedrange: true
                },

                annotations: [
                    {
                        x: 0.5,
                        y: 0.5,

                        xref: "paper",
                        yref: "paper",

                        text:
                            "No keyword-level temporal data are "
                            +
                            "available for "
                            +
                            selectedDomain
                            +
                            ".",

                        showarrow: false,

                        align: "center",

                        font: {
                            family:
                                "Arial, Helvetica, sans-serif",
                            size: 16,
                            color: "#65706c"
                        }
                    }
                ]
            },
            {
                responsive: true,
                displaylogo: false
            }
        );

        if (topicPlotLoading) {
            topicPlotLoading.hidden = true;
        }

        return;
    }


    /*
     Sort topics by total absolute frequency, then use the
     topic name as a stable secondary ordering rule.
    */
    const sortedTopics =
        [...domainTopics].sort(
            (topicA, topicB) => {
                const frequencyDifference =
                    Number(
                        topicB.total_frequency
                        || 0
                    )
                    -
                    Number(
                        topicA.total_frequency
                        || 0
                    );

                if (frequencyDifference !== 0) {
                    return frequencyDifference;
                }

                return String(
                    topicA.topic
                    || ""
                ).localeCompare(
                    String(
                        topicB.topic
                        || ""
                    )
                );
            }
        );


    /*
     topicCount may be a number, a numeric string, or "all".
    */
    const normalizedTopicCount =
        String(
            requestedTopicCount
        ).toLowerCase();

    const showAllTopics =
        normalizedTopicCount === "all";

    const numericTopicCount =
        Number.parseInt(
            requestedTopicCount,
            10
        );

    const displayedTopics =
        showAllTopics
            ? sortedTopics
            : sortedTopics.slice(
                0,
                Number.isFinite(
                    numericTopicCount
                )
                    ? Math.max(
                        1,
                        numericTopicCount
                    )
                    : 10
            );


    const years =
        Array.isArray(
            temporalState.topicData.years
        )
            ? temporalState.topicData.years
            : [];


    const useNormalizedFrequency =
        selectedMetric === "normalized";

    const metricArrayName =
        useNormalizedFrequency
            ? "normalized_frequency"
            : "absolute_frequency";

    const yAxisTitle =
        useNormalizedFrequency
            ? "Normalized frequency (per 1000 papers)"
            : "Absolute frequency";


    /*
     Plotly's qualitative palette is reused only when the
     number of selected topics exceeds the palette length.
    */
    const topicColors = [
        "#255f52",
        "#b56a3b",
        "#4f6f9f",
        "#8a5f86",
        "#7b8738",
        "#a44f56",
        "#327d86",
        "#9a7537",
        "#5d6b73",
        "#6d5795",
        "#477a55",
        "#bd5d87",
        "#6b83b5",
        "#aa704f",
        "#4c8c7b",
        "#8b6f4f",
        "#765b7f",
        "#758a9a",
        "#9b8651",
        "#587068"
    ];


    const traces =
        displayedTopics.map(
            (topic, index) => {
                const topicName =
                    String(
                        topic.topic
                        || "Unnamed topic"
                    );

                const topicValues =
                    Array.isArray(
                        topic[
                            metricArrayName
                        ]
                    )
                        ? topic[
                            metricArrayName
                        ]
                        : [];

                const totalFrequency =
                    Number(
                        topic.total_frequency
                        || 0
                    );

                const normalizedTotal =
                    Number(
                        topic.normalized_total
                        || 0
                    );

                const rank =
                    index + 1;

                const customData =
                    years.map(
                        () => [
                            rank,
                            totalFrequency,
                            normalizedTotal
                        ]
                    );

                return {
                    type: "bar",

                    name:
                        topicName,

                    x:
                        years,

                    y:
                        topicValues,

                    customdata:
                        customData,

                    marker: {
                        color:
                            topicColors[
                                index
                                %
                                topicColors.length
                            ]
                    },

                    opacity:
                        index < 3
                            ? 1
                            : 0.82,

                    hovertemplate:
                        "<b>%{fullData.name}</b>"
                        +
                        "<br>"
                        +
                        "Rank: %{customdata[0]}"
                        +
                        "<br>"
                        +
                        "Year: %{x}"
                        +
                        "<br>"
                        +
                        (
                            useNormalizedFrequency
                                ? "Normalized frequency: "
                                  +
                                  "%{y:.2f} per 1000 papers"
                                : "Absolute frequency: "
                                  +
                                  "%{y:,.0f}"
                        )
                        +
                        "<br>"
                        +
                        "Total frequency: "
                        +
                        "%{customdata[1]:,.0f}"
                        +
                        "<br>"
                        +
                        "Normalized total: "
                        +
                        "%{customdata[2]:,.2f}"
                        +
                        "<extra></extra>"
                };
            }
        );


    const plotTitle =
        selectedDomain;

    const plotSubtitle =
        displayedTopics.length
        +
        (
            displayedTopics.length === 1
                ? " topic"
                : " topics"
        )
        +
        " ranked by total frequency";


    const layout = {
        autosize: true,

        title: {
            text:
                plotTitle
                +
                "<br>"
                +
                "<span style='font-size:13px;color:#65706c'>"
                +
                plotSubtitle
                +
                "</span>",

            x: 0,
            xanchor: "left",

            y: 0.965,
            yanchor: "top",

            pad: {
                l: 2,
                r: 0,
                t: 0,
                b: 8
            },

            font: {
                family:
                    "Arial, Helvetica, sans-serif",
                size: 21,
                color: "#17221f"
            }
        },

        margin: {
            l: 78,
            r: 28,
            t: 108,
            b: 145
        },

        paper_bgcolor:
            "rgba(0, 0, 0, 0)",

        plot_bgcolor:
            "#ffffff",

        hovermode:
            "closest",

        barmode:
            "group",

        bargap:
            0.12,

        bargroupgap:
            0.04,

        hoverlabel: {
            bgcolor: "#ffffff",

            bordercolor:
                "rgba(37, 95, 82, 0.24)",

            font: {
                family:
                    "Arial, Helvetica, sans-serif",
                size: 13,
                color: "#17221f"
            }
        },

        xaxis: {
            title: {
                text: "Year",

                standoff: 14,

                font: {
                    family:
                        "Arial, Helvetica, sans-serif",
                    size: 14,
                    color: "#36433f"
                }
            },

            type: "linear",

            tickmode: "linear",
            dtick: 5,

            tickfont: {
                family:
                    "Arial, Helvetica, sans-serif",
                size: 12,
                color: "#596560"
            },

            showline: true,
            linewidth: 1,
            linecolor:
                "rgba(23, 34, 31, 0.42)",

            showgrid: true,
            gridwidth: 1,
            gridcolor:
                "rgba(23, 34, 31, 0.08)",

            zeroline: false,

            ticks: "outside",
            ticklen: 5,
            tickcolor:
                "rgba(23, 34, 31, 0.35)",

            automargin: true,

            range:
                years.length > 0
                    ? [
                        Math.min(
                            ...years
                        ),
                        Math.max(
                            ...years
                        )
                    ]
                    : undefined
        },

        yaxis: {
            title: {
                text:
                    yAxisTitle,

                standoff: 16,

                font: {
                    family:
                        "Arial, Helvetica, sans-serif",
                    size: 14,
                    color: "#36433f"
                }
            },

            rangemode: "tozero",

            tickfont: {
                family:
                    "Arial, Helvetica, sans-serif",
                size: 12,
                color: "#596560"
            },

            showline: true,
            linewidth: 1,
            linecolor:
                "rgba(23, 34, 31, 0.42)",

            showgrid: true,
            gridwidth: 1,
            gridcolor:
                "rgba(23, 34, 31, 0.08)",

            zeroline: true,
            zerolinewidth: 1,
            zerolinecolor:
                "rgba(23, 34, 31, 0.18)",

            ticks: "outside",
            ticklen: 5,
            tickcolor:
                "rgba(23, 34, 31, 0.35)",

            automargin: true
        },

        legend: {
            orientation: "h",

            x: 0,
            xanchor: "left",

            y: -0.22,
            yanchor: "top",

            traceorder: "normal",

            font: {
                family:
                    "Arial, Helvetica, sans-serif",
                size: 12,
                color: "#36433f"
            },

            bgcolor:
                "rgba(255, 255, 255, 0)",

            borderwidth: 0,

            itemclick:
                "toggle",

            itemdoubleclick:
                false
        },

        showlegend:
            true,

        uirevision:
            [
                selectedPanel,
                selectedDomain,
                selectedMetric,
                requestedTopicCount
            ].join("|")
    };


    const config = {
        responsive: true,

        displaylogo: false,

        scrollZoom: false,

        modeBarButtonsToRemove: [
            "select2d",
            "lasso2d",
            "autoScale2d"
        ],

        toImageButtonOptions: {
            format: "png",

            filename:
                selectedDomain
                    .toLowerCase()
                    .replace(
                        /[^a-z0-9]+/g,
                        "_"
                    )
                    .replace(
                        /^_+|_+$/g,
                        ""
                    )
                +
                "_topic_temporal_dynamics",

            scale: 2
        }
    };


    Plotly.react(
        temporalTopicPlot,
        traces,
        layout,
        config
    );

    /*
     Use a custom legend double-click handler because Plotly's
     built-in toggleothers behavior can be inconsistent after
     repeated Plotly.react updates.

     Double-click a topic:
       - isolate it when several topics are visible;
       - restore all topics when it is already isolated.
    */
    temporalTopicPlot.removeAllListeners(
        "plotly_legenddoubleclick"
    );

    temporalTopicPlot.on(
        "plotly_legenddoubleclick",
        function(event) {
            const selectedIndex =
                event.curveNumber;

            const plotData =
                temporalTopicPlot.data || [];

            if (
                selectedIndex === undefined
                ||
                !plotData[selectedIndex]
            ) {
                return false;
            }

            const selectedIsVisible =
                plotData[selectedIndex].visible
                !==
                "legendonly";

            const otherVisibleCount =
                plotData.reduce(
                    (count, trace, index) => {
                        if (
                            index !== selectedIndex
                            &&
                            trace.visible !== "legendonly"
                        ) {
                            return count + 1;
                        }

                        return count;
                    },
                    0
                );

            const selectedIsIsolated =
                selectedIsVisible
                &&
                otherVisibleCount === 0;

            if (selectedIsIsolated) {
                Plotly.restyle(
                    temporalTopicPlot,
                    {
                        visible: true
                    }
                );
            }
            else {
                const visibility =
                    plotData.map(
                        (_, index) =>
                            index === selectedIndex
                                ? true
                                : "legendonly"
                    );

                Plotly.restyle(
                    temporalTopicPlot,
                    {
                        visible: visibility
                    }
                );
            }

            /*
             Prevent Plotly from also applying its own
             double-click behavior.
            */
            return false;
        }
    );

    if (topicPlotLoading) {
        topicPlotLoading.hidden = true;
    }
}



/* =========================================================
   Initialize temporal page
========================================================= */

async function initializeTemporal() {

    try {

        if (temporalStatus) {
            temporalStatus.hidden = false;
            temporalStatus.textContent =
                "Loading temporal data...";
        }

        if (temporalError) {
            temporalError.hidden = true;
        }

        await loadTemporalData();

        initializeTemporalControls();

        updateTemporalButtons();

        /*
         Render immediately only when the Temporal tab is already
         visible. Otherwise, rendering is deferred until the user
         opens the tab in the tab-switching handler above.
        */
        if (
            temporalPage
            &&
            !temporalPage.hidden
            &&
            temporalPage.classList.contains("active")
        ) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    refreshTemporalView();
                });
            });
        }

        if (temporalStatus) {
            temporalStatus.hidden = true;
        }

    }

    catch (error) {

        console.error(
            "Temporal initialization failed:",
            error
        );

        if (temporalStatus) {
            temporalStatus.hidden = true;
        }

        if (temporalError) {
            temporalError.hidden = false;
        }

        if (domainPlotLoading) {
            domainPlotLoading.hidden = true;
        }

        if (topicPlotLoading) {
            topicPlotLoading.hidden = true;
        }

    }

}



/* =========================================================
   Initial setup
========================================================= */

if (temporalPage) {

    initializeTemporal();

}












// ============================================================
// Classification Evolution
// ============================================================

const evolutionButtons = document.querySelectorAll(
    ".classification-evolution-button"
);

const evolutionIframe = document.getElementById(
    "classification-evolution-iframe"
);

const evolutionLoading = document.getElementById(
    "classification-evolution-loading"
);

const evolutionSelectedPanel = document.getElementById(
    "classification-evolution-selected-panel"
);

function loadEvolutionPanel(button) {
    if (!button || !evolutionIframe) return;

    const panelName = button.dataset.evolutionPanel;
    const panelSrc = button.dataset.evolutionSrc;
    const panelTitle = button.dataset.evolutionTitle;

    evolutionButtons.forEach((item) => {
        const isActive = item === button;

        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
    });

    if (evolutionSelectedPanel) {
        evolutionSelectedPanel.textContent = panelName;
    }

    if (evolutionLoading) {
        evolutionLoading.hidden = false;
        evolutionLoading.textContent = `Loading ${panelName}...`;
    }

    evolutionIframe.title = panelTitle;
    evolutionIframe.src = panelSrc;
}

evolutionButtons.forEach((button) => {
    button.addEventListener("click", () => {
        loadEvolutionPanel(button);
    });
});

if (evolutionIframe) {
    evolutionIframe.addEventListener("load", () => {
        if (evolutionLoading) {
            evolutionLoading.hidden = true;
        }
    });
}



if (targetViewId === "panels-evolution-view") {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const iframe = document.getElementById(
                "classification-evolution-iframe"
            );

            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.dispatchEvent(new Event("resize"));
            }
        });
    });
}

