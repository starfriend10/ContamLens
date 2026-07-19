"use strict";

/* =========================================================
   Data source
========================================================= */

const DOMAIN_DATA_URL = "../data/domain_data.json";


/* =========================================================
   Domain settings
========================================================= */

const DOMAIN_SLUGS = {
    "Halogenated organics & POPs": "hocs-pops",
    "Inorganics & elements": "inorganics",
    "Hydrocarbons & petroleum": "hydrocarbons",
    "Atmospheric pollutants & particles": "atmospheric",
    "Non-halogenated organic compounds": "non-hocs",
    "Pesticides & biocides": "pesticides",
    "PFAS & organofluorine": "pfas",
    "Biological contaminants": "biological",
    "PPCPs": "ppcps",
    "Plastics & polymeric materials": "plastics",
    "Contextual environmental terms": "contextual",
    "Engineered nanomaterials": "nanomaterials",
    "Endocrine-active compounds": "eacs",
    "Nutrients & eutrophication": "nutrients",
    "Disinfection byproducts": "dbps",
    "Radionuclides": "radionuclides",
    "Surfactants & detergents": "surfactants",
    "Consumer chemicals": "consumer"
};


const DOMAIN_SHORT_NAMES = {
    "Halogenated organics & POPs": "HOCs & POPs",
    "Inorganics & elements": "Inorganics",
    "Hydrocarbons & petroleum": "Hydrocarbons",
    "Atmospheric pollutants & particles": "Atmospheric",
    "Non-halogenated organic compounds": "Non-HOCs",
    "Pesticides & biocides": "Pesticides",
    "PFAS & organofluorine": "PFAS",
    "Biological contaminants": "Biological",
    "PPCPs": "PPCPs",
    "Plastics & polymeric materials": "Plastics",
    "Contextual environmental terms": "Contextual",
    "Engineered nanomaterials": "Nanomaterials",
    "Endocrine-active compounds": "EACs",
    "Nutrients & eutrophication": "Nutrients",
    "Disinfection byproducts": "DBPs",
    "Radionuclides": "Radionuclides",
    "Surfactants & detergents": "Surfactants",
    "Consumer chemicals": "Consumer"
};


const DOMAIN_COLORS = {
    "Halogenated organics & POPs": "#E1A95F",
    "Inorganics & elements": "#4C72B0",
    "Hydrocarbons & petroleum": "#4C8C7A",
    "Atmospheric pollutants & particles": "#55A868",
    "Non-halogenated organic compounds": "#8172B2",
    "Pesticides & biocides": "#64B5CD",
    "PFAS & organofluorine": "#937860",
    "Biological contaminants": "#DD8452",
    "PPCPs": "#DA8BC3",
    "Plastics & polymeric materials": "#B55D4C",
    "Contextual environmental terms": "#A89C94",
    "Engineered nanomaterials": "#7A9E4B",
    "Endocrine-active compounds": "#CCB974",
    "Nutrients & eutrophication": "#6BAED6",
    "Disinfection byproducts": "#C44E52",
    "Radionuclides": "#8A7AAE",
    "Surfactants & detergents": "#8C8C8C",
    "Consumer chemicals": "#C97B9F"
};


const LEVEL_NAMES = {
    level_2: "Level 2",
    level_3: "Level 3",
    level_4: "Level 4",
    level_5: "Level 5 topic"
};


const FREQUENCY_METRIC_LABELS = {
    frequency: "Publication frequency",
    normalized_frequency_total:
        "Overall normalized frequency",
    normalized_frequency_avg:
        "Mean annual normalized frequency"
};


/* =========================================================
   State
========================================================= */

let domainData = null;
let selectedDomain = null;


/* =========================================================
   Elements
========================================================= */

const elements = {
    title: document.getElementById("domain-detail-title"),

    description: document.getElementById(
        "domain-detail-description"
    ),

    selector: document.getElementById("domain-selector"),

    statistics: document.getElementById(
        "domain-summary-statistics"
    ),

    loading: document.getElementById("domain-loading"),

    error: document.getElementById("domain-error"),

    dashboard: document.getElementById("domain-dashboard"),

    tree: document.getElementById("classification-tree"),

    expandTree: document.getElementById(
        "expand-hierarchy"
    ),

    collapseTree: document.getElementById(
        "collapse-hierarchy"
    ),

    frequencyLevel: document.getElementById(
        "frequency-level"
    ),

    frequencyMetric: document.getElementById(
        "frequency-metric"
    ),

    frequencyTopN: document.getElementById(
        "frequency-top-n"
    ),

    frequencyChart: document.getElementById(
        "domain-frequency-chart"
    ),

    geographyTopic: document.getElementById(
        "geography-topic"
    ),

    geographyMap: document.getElementById(
        "domain-geography-map"
    )
};


/* =========================================================
   Utility functions
========================================================= */

function getDomainSlug(domainName) {
    return DOMAIN_SLUGS[domainName] || "";
}


function getDomainBySlug(slug) {
    if (!domainData || !Array.isArray(domainData.domains)) {
        return null;
    }

    return domainData.domains.find((domain) => {
        return getDomainSlug(domain.level_1) === slug;
    }) || null;
}


function getQueryDomainSlug() {
    const parameters = new URLSearchParams(
        window.location.search
    );

    return parameters.get("domain") || "";
}


function formatInteger(value) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}


function formatDecimal(value, digits = 2) {
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits
    }).format(Number(value) || 0);
}


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function normalizeCountryName(countryName) {
    const corrections = {
        "USA": "United States",
        "United States of America": "United States",
        "UK": "United Kingdom",
        "England": "United Kingdom",
        "Scotland": "United Kingdom",
        "Wales": "United Kingdom",
        "Northern Ireland": "United Kingdom",
        "Republic of Korea": "South Korea",
        "Russian Federation": "Russia",
        "Czech Republic": "Czechia",
        "Viet Nam": "Vietnam",
        "Iran, Islamic Republic of": "Iran",
        "Hong Kong SAR": "Hong Kong",
        "Macao SAR": "Macao"
    };

    return corrections[countryName] || countryName;
}


function plotConfig(filename) {
    return {
        responsive: true,
        displaylogo: false,
        scrollZoom: false,

        modeBarButtonsToRemove: [
            "lasso2d",
            "select2d"
        ],

        toImageButtonOptions: {
            format: "png",
            filename,
            scale: 2
        }
    };
}


function getDomainColor() {
    return (
        DOMAIN_COLORS[selectedDomain?.level_1]
        || "#255f52"
    );
}


/* =========================================================
   Load data
========================================================= */

async function loadDomainData() {
    try {
        const response = await fetch(
            `${DOMAIN_DATA_URL}?v=${Date.now()}`
        );

        if (!response.ok) {
            throw new Error(
                `Unable to load ${DOMAIN_DATA_URL}`
            );
        }

        domainData = await response.json();

        if (
            !domainData
            || !Array.isArray(domainData.domains)
            || domainData.domains.length === 0
        ) {
            throw new Error(
                "No domain records were found."
            );
        }

        initializeDomainSelector();

        const requestedSlug = getQueryDomainSlug();

        selectedDomain =
            getDomainBySlug(requestedSlug)
            || domainData.domains[0];

        renderSelectedDomain();

        elements.loading.hidden = true;
        elements.error.hidden = true;
        elements.dashboard.hidden = false;
    }

    catch (error) {
        console.error(error);

        elements.loading.hidden = true;
        elements.dashboard.hidden = true;
        elements.error.hidden = false;
    }
}


/* =========================================================
   Domain selector
========================================================= */

function initializeDomainSelector() {
    elements.selector.innerHTML = "";

    domainData.domains.forEach((domain) => {
        const option = document.createElement("option");

        option.value = getDomainSlug(domain.level_1);

        option.textContent =
            DOMAIN_SHORT_NAMES[domain.level_1]
            || domain.level_1;

        elements.selector.appendChild(option);
    });


    elements.selector.addEventListener("change", () => {
        const slug = elements.selector.value;
        const domain = getDomainBySlug(slug);

        if (!domain) {
            return;
        }

        selectedDomain = domain;

        const newUrl =
            `${window.location.pathname}`
            + `?domain=${encodeURIComponent(slug)}`;

        window.history.replaceState(
            {},
            "",
            newUrl
        );

        renderSelectedDomain();
    });
}


/* =========================================================
   Render selected domain
========================================================= */

function renderSelectedDomain() {
    const fullName = selectedDomain.level_1;

    const shortName =
        DOMAIN_SHORT_NAMES[fullName]
        || fullName;

    const slug = getDomainSlug(fullName);

    document.title =
        `${shortName} | Contaminants & Stressors Explorer`;

    elements.title.textContent = shortName;

    elements.description.textContent =
        `Explore the classification, research frequency, `
        + `and geographic coverage of ${fullName}.`;

    elements.selector.value = slug;

    renderSummaryStatistics();
    renderClassificationTree();
    populateGeographyTopics();
    renderFrequencyChart();
    renderGeographyMap();
}


/* =========================================================
   Summary statistics
========================================================= */

function renderSummaryStatistics() {
    const countries = new Set();

    selectedDomain.topics.forEach((topic) => {
        topic.countries.forEach((country) => {
            countries.add(country.country_region);
        });
    });


    elements.statistics.innerHTML = `
        <span class="domain-summary-stat">
            <strong>
                ${formatInteger(selectedDomain.topic_count)}
            </strong>
            topics
        </span>

        <span class="domain-summary-stat">
            <strong>
                ${formatInteger(selectedDomain.total_frequency)}
            </strong>
            topic-paper counts
        </span>

        <span class="domain-summary-stat">
            <strong>
                ${formatInteger(countries.size)}
            </strong>
            countries/regions
        </span>
    `;
}


/* =========================================================
   Classification hierarchy
========================================================= */

function buildHierarchy(topics) {
    const root = {};

    topics.forEach((topic) => {
        const path = [
            topic.level_2,
            topic.level_3,
            topic.level_4,
            topic.level_5
        ].filter((value) => {
            return String(value || "").trim() !== "";
        });

        let branch = root;

        path.forEach((label, index) => {
            if (!branch[label]) {
                branch[label] = {
                    __children: {},
                    __topic: null
                };
            }

            if (index === path.length - 1) {
                branch[label].__topic = topic;
            }

            branch = branch[label].__children;
        });
    });

    return root;
}


function countDescendantTopics(node) {
    let count = node.__topic ? 1 : 0;

    Object.values(node.__children).forEach((child) => {
        count += countDescendantTopics(child);
    });

    return count;
}


function createTreeList(treeObject, depth = 0) {
    const list = document.createElement("ul");

    list.className =
        `tree-list tree-depth-${depth}`;

    const entries = Object.entries(treeObject);

    entries.sort((a, b) => {
        const countA = countDescendantTopics(a[1]);
        const countB = countDescendantTopics(b[1]);

        if (countA !== countB) {
            return countB - countA;
        }

        return a[0].localeCompare(b[0]);
    });


    entries.forEach(([label, node]) => {
        const item = document.createElement("li");

        const hasChildren =
            Object.keys(node.__children).length > 0;

        if (hasChildren) {
            const details =
                document.createElement("details");

            details.className = "tree-branch";

            if (depth === 0) {
                details.open = true;
            }

            const summary =
                document.createElement("summary");

            const descendantCount =
                countDescendantTopics(node);

            summary.innerHTML = `
                <span class="tree-label">
                    ${escapeHtml(label)}
                </span>

                <span class="tree-count">
                    ${formatInteger(descendantCount)}
                </span>
            `;

            details.appendChild(summary);

            details.appendChild(
                createTreeList(
                    node.__children,
                    depth + 1
                )
            );

            item.appendChild(details);
        }

        else {
            const topic = node.__topic;

            const button =
                document.createElement("button");

            button.type = "button";
            button.className = "tree-topic";

            button.innerHTML = `
                <span class="tree-label">
                    ${escapeHtml(label)}
                </span>

                <span class="tree-topic-frequency">
                    ${formatInteger(topic?.frequency || 0)}
                </span>
            `;

            button.addEventListener("click", () => {
                if (!topic) {
                    return;
                }

                elements.geographyTopic.value =
                    topic.topic_id;

                renderGeographyMap();
            });

            item.appendChild(button);
        }

        list.appendChild(item);
    });

    return list;
}


function renderClassificationTree() {
    elements.tree.innerHTML = "";

    const hierarchy = buildHierarchy(
        selectedDomain.topics
    );

    elements.tree.appendChild(
        createTreeList(hierarchy)
    );
}


elements.expandTree.addEventListener("click", () => {
    elements.tree
        .querySelectorAll("details")
        .forEach((details) => {
            details.open = true;
        });
});


elements.collapseTree.addEventListener("click", () => {
    elements.tree
        .querySelectorAll("details")
        .forEach((details) => {
            details.open = false;
        });
});


/* =========================================================
   Frequency aggregation
========================================================= */

function aggregateFrequency(level, metric) {
    const grouped = new Map();

    selectedDomain.topics.forEach((topic) => {
        const label = String(
            topic[level] || ""
        ).trim();

        if (!label) {
            return;
        }

        const value = Number(topic[metric]) || 0;

        if (!grouped.has(label)) {
            grouped.set(label, {
                label,
                value: 0,
                topicCount: 0
            });
        }

        const record = grouped.get(label);

        record.value += value;
        record.topicCount += 1;
    });


    return Array.from(grouped.values())
        .sort((a, b) => {
            if (a.value !== b.value) {
                return b.value - a.value;
            }

            return a.label.localeCompare(b.label);
        });
}


/* =========================================================
   Frequency chart
========================================================= */

function renderFrequencyChart() {
    const level = elements.frequencyLevel.value;
    const metric = elements.frequencyMetric.value;
    const topNValue = elements.frequencyTopN.value;

    let records = aggregateFrequency(
        level,
        metric
    );

    if (topNValue !== "all") {
        records = records.slice(
            0,
            Number(topNValue)
        );
    }

    records = records.reverse();

    const domainColor = getDomainColor();

    const metricLabel =
        FREQUENCY_METRIC_LABELS[metric]
        || "Frequency";

    const axisTitle =
        metric === "frequency"
            ? "Publication frequency"
            : `${metricLabel} (per 1000 publications)`;

    const hoverValueFormat =
        metric === "frequency"
            ? ",.0f"
            : ".2f";

    const hoverUnit =
        metric === "frequency"
            ? ""
            : " per 1000 publications";


    const trace = {
        type: "bar",
        orientation: "h",

        x: records.map((record) => {
            return record.value;
        }),

        y: records.map((record) => {
            return record.label;
        }),

        marker: {
            color: domainColor,
            opacity: 0.86
        },

        customdata: records.map((record) => {
            return [
                record.topicCount,
                LEVEL_NAMES[level]
            ];
        }),

        hovertemplate:
            "<b>%{y}</b><br>"
            + `${metricLabel}: `
            + `%{x:${hoverValueFormat}}`
            + `${hoverUnit}<br>`
            + "Classification: %{customdata[1]}<br>"
            + "Descendant topics: "
            + "%{customdata[0]:,.0f}"
            + "<extra></extra>"
    };


    const chartHeight = Math.max(
        470,
        records.length * 30 + 120
    );


    const layout = {
        autosize: true,
        height: chartHeight,

        margin: {
            t: 20,
            r: 30,
            b: 70,
            l: 220
        },

        paper_bgcolor: "white",
        plot_bgcolor: "white",

        font: {
            family: "Arial",
            size: 13,
            color: "#17221f"
        },

        xaxis: {
            title: {
                text: axisTitle,
                standoff: 16
            },

            showgrid: true,
            gridcolor: "rgba(23,34,31,0.10)",
            zeroline: false,
            automargin: true
        },

        yaxis: {
            automargin: true,

            tickfont: {
                size: 12
            }
        },

        hoverlabel: {
            bgcolor: "white",
            bordercolor: domainColor,

            font: {
                family: "Arial",
                size: 15,
                color: "#17221f"
            },

            align: "left"
        },

        showlegend: false
    };


    Plotly.react(
        elements.frequencyChart,
        [trace],
        layout,
        plotConfig(
            `${getDomainSlug(selectedDomain.level_1)}`
            + "_frequency"
        )
    );
}


elements.frequencyLevel.addEventListener(
    "change",
    renderFrequencyChart
);

elements.frequencyMetric.addEventListener(
    "change",
    renderFrequencyChart
);

elements.frequencyTopN.addEventListener(
    "change",
    renderFrequencyChart
);


/* =========================================================
   Geography topic selector
========================================================= */

function populateGeographyTopics() {
    elements.geographyTopic.innerHTML = "";

    const entireDomainOption =
        document.createElement("option");

    entireDomainOption.value = "__DOMAIN__";
    entireDomainOption.textContent = "Entire domain";

    elements.geographyTopic.appendChild(
        entireDomainOption
    );


    const topics = [...selectedDomain.topics].sort(
        (a, b) => {
            if (a.frequency !== b.frequency) {
                return b.frequency - a.frequency;
            }

            return a.level_5.localeCompare(
                b.level_5
            );
        }
    );


    topics.forEach((topic) => {
        const option =
            document.createElement("option");

        option.value = topic.topic_id;

        option.textContent =
            `${topic.level_5} `
            + `(${formatInteger(topic.frequency)})`;

        elements.geographyTopic.appendChild(
            option
        );
    });


    elements.geographyTopic.value =
        "__DOMAIN__";
}


elements.geographyTopic.addEventListener(
    "change",
    renderGeographyMap
);


/* =========================================================
   Geographic aggregation
========================================================= */

function getGeographyRecords() {
    const selectedTopicId =
        elements.geographyTopic.value;

    const countryCounts = new Map();


    const topics =
        selectedTopicId === "__DOMAIN__"
            ? selectedDomain.topics
            : selectedDomain.topics.filter((topic) => {
                return topic.topic_id === selectedTopicId;
            });


    topics.forEach((topic) => {
        topic.countries.forEach((record) => {
            const country = normalizeCountryName(
                record.country_region
            );

            const count =
                Number(record.publication_count) || 0;

            countryCounts.set(
                country,
                (countryCounts.get(country) || 0)
                + count
            );
        });
    });


    return Array.from(
        countryCounts,
        ([country, publicationCount]) => {
            return {
                country,
                publicationCount
            };
        }
    ).sort((a, b) => {
        return b.publicationCount
            - a.publicationCount;
    });
}


/* =========================================================
   Geographic map
========================================================= */

function renderGeographyMap() {
    const records = getGeographyRecords();

    const domainColor = getDomainColor();

    const selectedTopicId =
        elements.geographyTopic.value;

    const selectedTopic =
        selectedTopicId === "__DOMAIN__"
            ? null
            : selectedDomain.topics.find((topic) => {
                return topic.topic_id
                    === selectedTopicId;
            });

    const viewLabel =
        selectedTopic
            ? selectedTopic.level_5
            : selectedDomain.level_1;


    if (records.length === 0) {
        Plotly.react(
            elements.geographyMap,
            [],
            {
                autosize: true,
                height: 590,

                annotations: [
                    {
                        text:
                            "No geographic records are available.",
                        showarrow: false,
                        x: 0.5,
                        y: 0.5,

                        font: {
                            family: "Arial",
                            size: 15,
                            color: "#66736f"
                        }
                    }
                ],

                xaxis: {
                    visible: false
                },

                yaxis: {
                    visible: false
                },

                paper_bgcolor: "white",
                plot_bgcolor: "white",

                margin: {
                    t: 20,
                    r: 10,
                    b: 10,
                    l: 10
                }
            },

            plotConfig(
                `${getDomainSlug(selectedDomain.level_1)}`
                + "_geography"
            )
        );

        return;
    }


    /*
     * Log-transform publication counts for color only.
     * This makes all represented countries visible while
     * preserving the underlying publication-count differences.
     */
    const colorValues = records.map((record) => {
        return Math.log10(
            record.publicationCount + 1
        );
    });

    const maxPublicationCount = Math.max(
        ...records.map((record) => {
            return record.publicationCount;
        }),
        1
    );

    const maxColorValue = Math.log10(
        maxPublicationCount + 1
    );


    const trace = {
        type: "choropleth",

        locationmode: "country names",

        locations: records.map((record) => {
            return record.country;
        }),

        z: colorValues,

        text: records.map((record) => {
            return record.country;
        }),

        customdata: records.map((record) => {
            return record.publicationCount;
        }),

        zmin: 0,
        zmax: maxColorValue,

        colorscale: [
            [0.00, "#DCE9E4"],
            [0.15, "#C2D8D0"],
            [0.35, "#9BBFB2"],
            [0.58, "#70A292"],
            [0.80, "#467E6E"],
            [1.00, domainColor]
        ],

        marker: {
            line: {
                color: "#FFFFFF",
                width: 0.6
            }
        },

        showscale: false,

        hovertemplate:
            "<b>%{text}</b><br>"
            + "Publications: "
            + "%{customdata:,.0f}"
            + "<extra></extra>"
    };


    const layout = {
        autosize: true,
        height: 590,

        margin: {
            t: 34,
            r: 10,
            b: 10,
            l: 10
        },

        title: {
            text: viewLabel,
            x: 0.01,
            xanchor: "left",

            font: {
                family: "Arial",
                size: 15,
                color: "#17221f"
            }
        },

        paper_bgcolor: "white",

        geo: {
            scope: "world",

            projection: {
                type: "natural earth"
            },

            showframe: false,
            showcoastlines: false,

            showland: true,
            landcolor: "#ECEFED",

            showcountries: true,
            countrycolor: "#FFFFFF",

            bgcolor: "white"
        },

        hoverlabel: {
            bgcolor: "white",
            bordercolor: domainColor,

            font: {
                family: "Arial",
                size: 15,
                color: "#17221f"
            },

            align: "left"
        }
    };


    Plotly.react(
        elements.geographyMap,
        [trace],
        layout,
        plotConfig(
            `${getDomainSlug(selectedDomain.level_1)}`
            + "_geography"
        )
    );
}


/* =========================================================
   Resize visible Plotly figures
========================================================= */

window.addEventListener("resize", () => {
    if (elements.dashboard.hidden) {
        return;
    }

    Plotly.Plots.resize(
        elements.frequencyChart
    );

    Plotly.Plots.resize(
        elements.geographyMap
    );
});


/* =========================================================
   Initialize
========================================================= */

loadDomainData();