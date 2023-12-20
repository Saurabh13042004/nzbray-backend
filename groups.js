import tls from 'tls';

// Replace these with your Usenet server details
const usenetConfig = {
  host: 'news.usenet.farm',
  port: 563, // SSL port
};

// Replace these with your Usenet server credentials
const credentials = {
  username: 'uf19efd0421df04cb3c9',
  password: '07a38170a4460ec25ed7ac',
};

// Replace 'a.b.nl' with the actual newsgroup you want to search
const newsgroup = 'a.b.nl';

const options = {
  host: usenetConfig.host,
  port: usenetConfig.port,
};

const client = tls.connect(options, () => {
  console.log('Connected to Usenet server');

  // Send authentication commands
  client.write(`AUTHINFO USER ${credentials.username}\r\n`);
  client.write(`AUTHINFO PASS ${credentials.password}\r\n`);

  // Send commands to select the newsgroup and retrieve headers
  client.write(`GROUP ${newsgroup}\r\n`);
  client.write(`XOVER 1-10\r\n`); // Retrieve headers for articles 1 to 10 (adjust as needed)
  client.write('QUIT\r\n');
});

let headersData = '';
let receivingHeaders = false;

client.on('data', (data) => {
  const response = data.toString();
  console.log(response);

  // Check if the response contains the headers
  if (response.startsWith('224')) {
    // Headers are being sent, set the flag to start receiving headers
    receivingHeaders = true;
  }

  if (receivingHeaders) {
    // Append data to the headersData variable
    headersData += response;

    // Check if the received data ends with a line starting with a dot
    if (response.endsWith('\r\n.\r\n')) {
      // Headers are complete, you can process the headers now
      console.log('Headers received:');
      console.log(headersData);

      // Reset the variables for the next response
      receivingHeaders = false;
      headersData = '';
    }
  }
});

client.on('end', () => {
  console.log('Disconnected from Usenet server');
});

client.on('error', (err) => {
  console.error(`Error: ${err.message}`);
});
