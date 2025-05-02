import prompt from 'prompt-async';
import pg from 'pg';
const { Client } = pg;
const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_0pgwJMCOrht1@ep-frosty-fire-a94nhe0n-pooler.gwc.azure.neon.tech/neondb?sslmode=require'
});
async function getDataFromDB() {
    const { rows } = await client.query('Select first_name, mark from students');
    console.log(rows);
}
async function insertDataIntoDB(data) {
    const queryText = 'INSERT INTO students(first_name, last_name, email, phone_number, mark) VALUES($1, $2, $3, $4, $5)';
    try {
        const res = await client.query(queryText, [data.first_name, data.last_name, data.email, data.phone_number, data.mark]);
        console.log(res);
    } catch (error) {
        if (error.code === '23505') { // Код помилки для unique constraint
            console.log('Error: Data already exists.');
            const { retry } = await prompt.get([{
                name: 'retry',
                message: 'Retry? (yes/no)',
                validator: /^(yes|no)$/i,
                warning: 'Please enter "yes" or "no"'
            }]);
            if (retry.toLowerCase() === 'yes') {
                const newData = await getDataFromConsole();
                await insertDataIntoDB(newData);
            } else {
                console.log('Program terminated.');
                await client.end();
                process.exit(0);
            }
        } else {
            console.error('Error:', error.message);
        }
    }
}
async function getDataFromConsole() {
    prompt.start();
    const { first_name, last_name, email, phone_number, mark } = await prompt.get(["first_name", "last_name", "email", "phone_number", "mark"]);
    return {
        first_name,
        last_name,
        email,
        phone_number,
        mark,
    };
}
async function main() {
    await client.connect();
    await getDataFromDB();
    let userData;
    do {
        userData = await getDataFromConsole();
        if (!!userData.first_name) {
            await insertDataIntoDB(userData);
        }
    } while (!!userData.first_name);
    await client.end();
}
main();