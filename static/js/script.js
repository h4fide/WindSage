const svg = d3.select("#wind-map");
const width = svg.attr("width");
const height = svg.attr("height");

let forecastData = [];
let currentForecastIndex = 0;

function createStreamlines(angle) {
    const windData = [
        { x1: 400, y1: 100, x2: 800, y2: 100 },
        { x1: 400, y1: 200, x2: 800, y2: 200 },
        { x1: 400, y1: 300, x2: 800, y2: 300 }
    ];

    const rotatedData = windData.map(d => {
        const centerX = (d.x1 + d.x2) / 2;
        const centerY = (d.y1 + d.y2) / 2;
        const rotatedX1 = Math.cos(angle) * (d.x1 - centerX) - Math.sin(angle) * (d.y1 - centerY) + centerX;
        const rotatedY1 = Math.sin(angle) * (d.x1 - centerX) + Math.cos(angle) * (d.y1 - centerY) + centerY;
        const rotatedX2 = Math.cos(angle) * (d.x2 - centerX) - Math.sin(angle) * (d.y2 - centerY) + centerX;
        const rotatedY2 = Math.sin(angle) * (d.x2 - centerX) + Math.cos(angle) * (d.y2 - centerY) + centerY;
        return { x1: rotatedX1, y1: rotatedY1, x2: rotatedX2, y2: rotatedY2 };
    });

    svg.selectAll(".streamline").remove();

    svg.selectAll("path")
        .data(rotatedData)
        .enter()
        .append("path")
        .attr("d", d => `M${d.x1},${d.y1} Q${(d.x1 + d.x2) / 2},${(d.y1 + d.y2) / 2 + 50} ${d.x2},${d.y2}`)
        .attr("stroke", "#3498db")
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .attr("marker-end", "url(#arrowhead)")
        .attr("class", "streamline");

    animateStreamlines();
}

function animateStreamlines() {
    svg.selectAll(".streamline")
        .attr("stroke-dasharray", function() {
            return this.getTotalLength();
        })
        .attr("stroke-dashoffset", function() {
            return this.getTotalLength();
        })
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .on("end", animateStreamlines);
}

function updateWindInfo(data) {
    console.log("Updating wind info with data:", data);
    document.getElementById("forecastTime").textContent = new Date(data.time).toLocaleString();
    document.getElementById("windSpeed").textContent = `${data.wind_speed.toFixed(2)} km/h`;
    document.getElementById("windDirection").textContent = `${data.wind_direction}°`;
    document.getElementById("cardinalDirection").textContent = data.cardinal_direction;

    const angle = ((360 - data.wind_direction) * Math.PI) / 180;
    createStreamlines(angle);
}

function fetchWindData() {
    console.log("Fetching wind data...");
    fetch('/api/wind-data')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Received wind data:", data);
            forecastData = data;
            currentForecastIndex = findNearestHourIndex(forecastData);
            updateWindInfo(forecastData[currentForecastIndex]);
        })
        .catch(error => {
            console.error('Error fetching wind data:', error);
            document.getElementById("forecastTime").textContent = "Error fetching data";
            document.getElementById("windSpeed").textContent = "Error fetching data";
            document.getElementById("windDirection").textContent = "Error fetching data";
            document.getElementById("cardinalDirection").textContent = "Error fetching data";
        });
}

function findNearestHourIndex(data) {
    const now = new Date();
    const nearestHour = new Date(now);
    nearestHour.setMinutes(0, 0, 0);
    if (now.getMinutes() >= 30) {
        nearestHour.setHours(nearestHour.getHours() + 1);
    }
    for (let i = 0; i < data.length; i++) {
        const dataTime = new Date(data[i].time);
        if (dataTime >= nearestHour) {
            return i;
        }
    }
    return 0;
}

function nextHours() {
    currentForecastIndex = (currentForecastIndex + 1) % forecastData.length;
    updateWindInfo(forecastData[currentForecastIndex]);
}

// Initial fetch and set up interval for updates
fetchWindData();
setInterval(fetchWindData, 300000); // Update every 5 minutes

// Add event listener for the Next Hours button
document.getElementById("nextHoursBtn").addEventListener("click", nextHours);
