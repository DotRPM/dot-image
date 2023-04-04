import express from 'express';
import axios from 'axios';
import 'dotenv/config';

const router = express.Router();
const client = axios.create({
  headers: { Authorization: 'Bearer ' + process.env.OPEN_AI_API_KEY }
});

router.get('/:title', async (req, res) => {
  try {
    const { data } = await client.post(
      'https://api.openai.com/v1/images/generations',
      {
        prompt: req.params.title,
        size: '256x256'
      }
    );
    res.status(200).json({ src: data.data[0].url });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

export default router;
