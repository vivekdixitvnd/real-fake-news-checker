// server/newsverify.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const verifyWithNewsSources = async (query) => {
  const apiKey = process.env.NEWS_API_KEY;

  try {
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: query,
        language: "en",
        sortBy: "relevancy",
        apiKey: apiKey
      }
    });

    const articles = response.data.articles || [];

    if (articles.length > 0) {
      const topArticle = articles[0];
      return {
        status: "REAL (Matched in News)",
        source: topArticle.source.name,
        link: topArticle.url,
        title: topArticle.title
      };
    } else {
      return {
        status: "UNVERIFIED",
        source: null,
        link: null,
        title: null
      };
    }
  } catch (err) {
    console.error("News API error:", err.message);
    return {
      status: "UNVERIFIED",
      source: null,
      link: null,
      title: null
    };
  }
};
