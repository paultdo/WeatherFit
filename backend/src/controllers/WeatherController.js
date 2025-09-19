const CURRENT_FIELDS = "temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m,precipitation_probability";
const HOURLY_FIELDS = "temperature_2m,precipitation_probability,relative_humidity_2m,wind_speed_10m";
const HOURS_TO_ANALYZE = 12;

const buildRecommendations = ({ temperature, humidity, precipitation_chance, wind_speed }) => {
    let recommendations = [];

    if (temperature < 50) {
        recommendations.push("It's quite cold outside. Wear a warm jacket, gloves, and a hat.");
    } else if (temperature >= 50 && temperature < 70) {
        recommendations.push("The weather is cool. A light jacket or sweater should be fine.");
    } else {
        recommendations.push("It's warm outside. Light clothing is recommended.");
    }

    if (humidity > 50) {
        recommendations.push("High humidity detected. Wear breathable fabrics to stay comfortable.");
    }

    if (precipitation_chance > 30) {
        recommendations.push("There's a good chance of precipitation. Don't forget to carry an umbrella or wear a waterproof jacket.");
    }

    return recommendations;
};

const mapHourlyForecast = (hourly) => {
    if (!hourly || !Array.isArray(hourly.time)) {
        return [];
    }

    const entries = [];
    for (let index = 0; index < hourly.time.length; index += 1) {
        entries.push({
            time: hourly.time[index],
            temperature_2m: hourly.temperature_2m ? hourly.temperature_2m[index] : undefined,
            precipitation_probability: hourly.precipitation_probability ? hourly.precipitation_probability[index] : undefined,
            relative_humidity_2m: hourly.relative_humidity_2m ? hourly.relative_humidity_2m[index] : undefined,
            wind_speed_10m: hourly.wind_speed_10m ? hourly.wind_speed_10m[index] : undefined
        });
    }
    return entries;
};

const selectUpcomingHours = (hours) => {
    if (!hours.length) {
        return [];
    }

    const now = Date.now();
    const upcoming = hours.filter((hour) => {
        const timestamp = new Date(hour.time).getTime();
        return !Number.isNaN(timestamp) && timestamp >= now;
    });

    if (upcoming.length >= HOURS_TO_ANALYZE) {
        return upcoming.slice(0, HOURS_TO_ANALYZE);
    }

    if (!upcoming.length) {
        return hours.slice(0, HOURS_TO_ANALYZE);
    }

    const remaining = HOURS_TO_ANALYZE - upcoming.length;
    return upcoming.concat(hours.slice(upcoming.length, upcoming.length + remaining));
};

const formatHour = (value) => {
    try {
        return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
    } catch (error) {
        console.error("Unable to format forecast hour", error);
        return value;
    }
};

const summarizeForecast = (hours) => {
    if (!hours.length) {
        return {
            summary: { temperature: 0, humidity: 0, precipitation_chance: 0, wind_speed: 0 },
            highlights: []
        };
    }

    let coldestHour = null;
    let warmestHour = null;
    let wettestHour = null;
    let windiestHour = null;
    let mostHumidHour = null;

    hours.forEach((hour) => {
        if (!coldestHour || Number(hour.temperature_2m) < Number(coldestHour.temperature_2m)) {
            coldestHour = hour;
        }
        if (!warmestHour || Number(hour.temperature_2m) > Number(warmestHour.temperature_2m)) {
            warmestHour = hour;
        }
        if (!wettestHour || Number(hour.precipitation_probability) > Number(wettestHour.precipitation_probability)) {
            wettestHour = hour;
        }
        if (!windiestHour || Number(hour.wind_speed_10m) > Number(windiestHour.wind_speed_10m)) {
            windiestHour = hour;
        }
        if (!mostHumidHour || Number(hour.relative_humidity_2m) > Number(mostHumidHour.relative_humidity_2m)) {
            mostHumidHour = hour;
        }
    });

    const summary = {
        temperature: Number(coldestHour?.temperature_2m) || 0,
        humidity: Number(mostHumidHour?.relative_humidity_2m) || 0,
        precipitation_chance: Number(wettestHour?.precipitation_probability) || 0,
        wind_speed: Number(windiestHour?.wind_speed_10m) || 0
    };

    const highlights = [];
    const temperatureSwing = warmestHour && coldestHour
        ? Math.abs(Number(warmestHour.temperature_2m) - Number(coldestHour.temperature_2m))
        : 0;

    if (wettestHour && summary.precipitation_chance >= 30) {
        highlights.push(`Rain expected around ${formatHour(wettestHour.time)} (${summary.precipitation_chance}% chance).`);
    }

    if (temperatureSwing >= 12 && warmestHour && coldestHour) {
        const trend = Number(warmestHour.temperature_2m) > Number(coldestHour.temperature_2m) ? "warmer" : "cooler";
        const referenceHour = trend === "warmer" ? warmestHour : coldestHour;
        highlights.push(`Temperatures get ${trend} near ${formatHour(referenceHour.time)} (swing of ${Math.round(temperatureSwing)}°F).`);
    }

    if (windiestHour && summary.wind_speed >= 20) {
        highlights.push(`Wind picks up to ${Math.round(summary.wind_speed)} mph around ${formatHour(windiestHour.time)}.`);
    }

    if (mostHumidHour && summary.humidity >= 80) {
        highlights.push(`Humidity spikes to ${Math.round(summary.humidity)}% near ${formatHour(mostHumidHour.time)}.`);
    }

    return { summary, highlights };
};

const controller = {
    getRecommendation: (req, res) => {
        const { temperature, humidity, precipitation_chance, wind_speed } = req.body;
        let recommendations = buildRecommendations({ temperature, humidity, precipitation_chance, wind_speed });
        res.json({ recommendations });
    },

    getHourlyRecommendation: async (req, res) => {
        const { latitude, longitude, timezone } = req.body;
        const latitudeValue = Number(latitude);
        const longitudeValue = Number(longitude);

        if (Number.isNaN(latitudeValue) || Number.isNaN(longitudeValue)) {
            return res.status(400).json({ reason: 'Latitude and longitude are required for hourly weather.' });
        }

        try {
            const params = new URLSearchParams({
                latitude: latitudeValue,
                longitude: longitudeValue,
                current: CURRENT_FIELDS,
                hourly: HOURLY_FIELDS,
                temperature_unit: 'fahrenheit',
                windspeed_unit: 'mph',
                timezone: timezone || 'auto',
                forecast_days: '2'
            });

            const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
            if (!response.ok) {
                return res.status(502).json({ reason: 'Failed to fetch hourly forecast from Open-Meteo.' });
            }

            const data = await response.json();
            const mappedHours = mapHourlyForecast(data?.hourly);
            const forecast = selectUpcomingHours(mappedHours).slice(0, HOURS_TO_ANALYZE);
            if (!forecast.length) {
                return res.json({
                    current: data?.current || null,
                    forecast: [],
                    recommendations: [],
                    changes: []
                });
            }
            const { summary, highlights } = summarizeForecast(forecast);
            let recommendations = buildRecommendations(summary);

            res.json({
                current: data?.current || null,
                forecast,
                recommendations,
                changes: highlights
            });
        } catch (error) {
            console.error('Error fetching hourly weather:', error);
            res.status(500).json({ reason: 'Unable to fetch hourly weather information.' });
        }
    }
};

export default controller;
