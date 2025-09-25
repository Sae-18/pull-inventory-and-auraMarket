import fs from "fs";
import csv from "csv-parser";

function convertCsvToJson(csvFilePath, jsonFilePath) {
    const results = [];

    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on("data", (row) => {
            console.log(Object.keys(row));

            const card = {
                cardId: row.cardID,
                character: row.character,
                name: row.name,
                rarity: row.rarity,
                position: row.position,
                stamina: parseInt(row.stamina, 10),
                stats: {
                    shooting: {
                        value: parseInt(row.shooting, 10),
                        cost: parseInt(row.shooting_cost, 10)
                    },
                    dribbling: {
                        value: parseInt(row.dribbling, 10),
                        cost: parseInt(row.dribbling_cost, 10)
                    },
                    speed: {
                        value: parseInt(row.speed, 10),
                        cost: parseInt(row.speed_cost, 10)
                    },
                    defending: {
                        value: parseInt(row.defending, 10),
                        cost: parseInt(row.defending_cost, 10)
                    },
                    passing: {
                        value: parseInt(row.passing, 10),
                        cost: parseInt(row.passing_cost, 10)
                    }
                },
                imageUrl: row.image_URL
            };

            results.push(card);
        })
        .on("end", () => {
            fs.writeFileSync(jsonFilePath, JSON.stringify(results, null, 2));
            console.log(`✅ JSON saved to ${jsonFilePath}`);
        });
}

// Example usage:
convertCsvToJson("cards.csv", "cards.json");
