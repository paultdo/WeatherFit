const controller = {
    getRecommendation: (req, res) => {
        const { temperature, humidity, precipitation_chance, wind_speed } = req.body;
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
        res.json({ recommendations });
    }
}

export default controller;