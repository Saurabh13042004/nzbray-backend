// Import the necessary modules
import express from 'express';
import cors from 'cors';
import cheerio from 'cheerio';
import axios from 'axios';
import path from 'path';

const app = express();
const port = 3001;

app.use(cors());

// Set a higher timeout value for Axios requests
const axiosInstance = axios.create({ timeout: 10000 });
app.get('/nzb/:nzbId', async (req, res) => {
  try {
    const { nzbId } = req.params;

    // Adjust the URL based on your backend API endpoint for fetching the NZB file
    const nzbFileUrl = `https://nzbking.com/nzb:${nzbId}/`;

    // Fetch the NZB file
    const response = await axiosInstance.get(nzbFileUrl, { responseType: 'stream' });

    // Set the appropriate headers for the download
    res.setHeader('Content-Type', 'application/x-nzb');
    res.setHeader('Content-Disposition', `attachment; filename=${nzbId}.nzb`);

    // Pipe the NZB file stream to the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching NZB file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/groups', async (req, res) => {
  try {
    const response = await axiosInstance.get('https://nzbking.com/groups');
    const html = response.data;
    const $ = cheerio.load(html);
    const groupDetails = [];

    $('.group-detail').each((i, elem) => {
      if (i !== 0) { // Skip the header row
        const count = $(elem).find('.group-detail-count').text();
        const name = $(elem).find('.group-detail-name a').text();
        const last_update = $(elem).find('.group-detail-last-post').text();
        const last_scan_date = $(elem).find('.group-detail-last-scan').text();
        const activity_per_week = $(elem).find('.group-detail-activity').text();

        groupDetails.push({
          count,
          name,
          last_update,
          last_scan_date,
          activity_per_week
        });
      }
    });

    res.json(groupDetails);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/groups/popular', async (req, res) => {
  try {
    const { page = 0 } = req.query;
    const resultsPerPage = 500;
    const offset = page * resultsPerPage;

    const response = await axios.get('https://nzbking.com/groups');
    const html = response.data;
    const $ = cheerio.load(html);
    const groupDetails = [];

    $('.group-detail').each((i, elem) => {
      if (i !== 0) {
        const count = $(elem).find('.group-detail-count').text();
        const name = $(elem).find('.group-detail-name a').text();
        const last_update = $(elem).find('.group-detail-last-post').text();
        const last_scan_date = $(elem).find('.group-detail-last-scan').text();
        const activity_per_week = $(elem).find('.group-detail-activity').text();

        groupDetails.push({
          count,
          name,
          last_update,
          last_scan_date,
          activity_per_week
        });
      }
    });

    res.json(groupDetails);
  } catch (error) {
    console.error('Error fetching popular groups:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/groups/all', async (req, res) => {
  try {
    const { page = 0 } = req.query;
    const resultsPerPage = 500;
    const offset = page * resultsPerPage;

    const response = await axios.get(`https://www.nzbking.com/groups/?o=${offset}`);
    const html = response.data;
    const $ = cheerio.load(html);
    const groupDetails = [];

    $('.group-detail').each((i, elem) => {
      if (i !== 0) { // Skip the header row
        const count = $(elem).find('.group-detail-count').text();
        const name = $(elem).find('.group-detail-name a').text();
        const last_update = $(elem).find('.group-detail-last-post').text();
        const last_scan_date = $(elem).find('.group-detail-last-scan').text();
        const activity_per_week = $(elem).find('.group-detail-activity').text();

        groupDetails.push({
          count,
          name,
          last_update,
          last_scan_date,
          activity_per_week
        });
      }
    });

    res.json(groupDetails);
  } catch (error) {
    console.error('Error fetching all groups:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/search', async (req, res) => {
  try {
    const { q, page = 1, ft = '', gr = '', po = '', so = 'Date' } = req.query;
    const resultsPerPage = 50;

    const url = `https://www.nzbking.com/?q=${q}&o=${(page - 1) * resultsPerPage}&ft=${ft}&gr=${gr}&po=${po}&so=${so}`;

    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const searchResults = [];

    $('.search-result').each((i, elem) => {
      if (i !== 0) {
        const title = $(elem).find('.search-subject').text();
        const poster = $(elem).find('.search-poster a').text();
        const grp = $(elem).find('.search-groups').text();
        const nzbId = $(elem).find('a.button').attr('href').match(/\/nzb:(\w+)\//)[1];

        searchResults.push({
          title,
          poster,
          grp,
          nzbId,
        });
      }
    });

    res.json(searchResults);
  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/post-details/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    // Adjust the URL based on your backend API endpoint for fetching post details
    const postDetailsUrl = `https://www.nzbking.com/details:${postId}/`;

    // Fetch the post details
    const response = await axios.get(postDetailsUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    const headers = $('.post-detail-header').map((index, element) => $(element).text().trim()).get();
    const values = $('.post-detail-value').map((index, element) => $(element).text().trim()).get();
    const fileSize = $('.file-detail-size').map((index, element) => $(element).text().trim()).get();
    const fileName = $('.file-detail-name').map((index, element) => $(element).text().trim()).get();


    const formattedDetails = headers.map((header, index) => {
      return {
        label: header,
        content: values[index],
      };
    });

    const fileDetails = fileName.map((name, index) => {
      return {
        name,
        size: fileSize[index],
      };
    });

    res.json({ header: 'Details', value: formattedDetails, fileDetails });
  } catch (error) {
    console.error('Error fetching post details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}


// app.get('/search', async (req, res) => {
//   try {
//     const { q, page = 1 } = req.query;
//     const resultsPerPage = 50;

//     // Adjust the URL based on the page number
//     const url = `https://www.nzbking.com/?q=${q}&o=${(page - 1) * resultsPerPage}`;

//     const response = await axios.get(url);
//     const html = response.data;
//     const $ = cheerio.load(html);
//     const searchResults = [];

//     $('.search-subject').each((i, elem) => {
//       // Skip the header row
//       if (i !== 0) {
//         const title = $(elem).contents().first().text().trim();
//         const poster = $(elem).find('.search-poster a').text();
//         const grp = $(elem).find('.search-groups').text();
//         const nzbId = $(elem).find('a.button').attr('href').match(/\/nzb:(\w+)\//)[1];
//         const nfoLink = $(elem).find('a.button[href^="/nfo"]').attr('href');
//         const detailsLink = $(elem).find('a.button[href^="/details"]').attr('href');
//         const parts = $(elem).contents().filter((index, content) => $(content).text().includes('parts:')).text().trim();
//         const size = $(elem).contents().filter((index, content) => $(content).text().includes('size:')).text().trim();
//         const filetypes = $(elem).contents().filter((index, content) => $(content).text().includes('filetypes:')).text().trim();

//         searchResults.push({
//           title,
//           nzbId,
//           nfoLink,
//           detailsLink,
//           parts,
//           size,
//           filetypes,
//           poster,
//           grp
//         });
//       }
//     });

//     res.json(searchResults);
//   } catch (error) {
//     console.error('Error fetching search results:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// ... (existing code)

app.get('/groups/search', async (req, res) => {
  try {
    const { q } = req.query;
    const response = await axios.get(`https://nzbking.com/groups?q=${q}`);
    const html = response.data;
    const $ = cheerio.load(html);
    const groupDetails = [];

    $('.group-detail').each((i, elem) => {
      if (i !== 0) { // Skip the header row
        const count = $(elem).find('.group-detail-count').text();
        const name = $(elem).find('.group-detail-name a').text();
        const last_update = $(elem).find('.group-detail-last-post').text();
        const last_scan_date = $(elem).find('.group-detail-last-scan').text();
        const activity_per_week = $(elem).find('.group-detail-activity').text();

        groupDetails.push({
          count,
          name,
          last_update,
          last_scan_date,
          activity_per_week
        });
      }
    });

    res.json(groupDetails);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ... (existing code)

app.get('/group/:groupName', async (req, res) => {
  try {
    const { groupName } = req.params;

    // Adjust the URL based on your backend API endpoint for fetching group details
    const groupDetailsUrl = `https://www.nzbking.com/group/${groupName}`;

    // Fetch the group details
    const response = await axios.get(groupDetailsUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    const groupDetails = $('.search-result').map((index, element) => {
      const subjectElem = $(element).find('.search-subject');

      const title = subjectElem.contents().first().text().trim();
      const nzbLink = subjectElem.find('a.button[href^="/nzb"]');
      const nzbIdMatch = nzbLink.attr('href') ? nzbLink.attr('href').match(/\/nzb:(\w+)\//) : null;
      const nzbId = nzbIdMatch ? nzbIdMatch[1] : null;

      const nfoLink = subjectElem.find('a.button[href^="/nfo"]').attr('href');
      const detailsLink = subjectElem.find('a.button[href^="/details"]').attr('href');
      const parts = subjectElem.contents().filter((index, content) => $(content).text().includes('parts:')).text().trim();
      const size = subjectElem.contents().filter((index, content) => $(content).text().includes('size:')).text().trim();
      const filetypes = subjectElem.contents().filter((index, content) => $(content).text().includes('filetypes:')).text().trim();






      const poster = $(element).find('.search-poster a').text().trim();
      const groups = $(element).find('.search-groups').text().trim();
      const age = $(element).find('.search-age').text().trim();

      return {
        title,
        nzbId,
        nfoLink,
        detailsLink,
        parts,
        size,
        filetypes,
        poster,
        groups,
        age,
      };
    }).get();

    res.json(groupDetails);
  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ... (existing code)


// ... (existing code)

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
