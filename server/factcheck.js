// server/factcheck.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const checkFact = async (query) => {
  const apiKey = process.env.GOOGLE_FACTCHECK_API_KEY;

  try {
    const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(query)}&key=${apiKey}`;
    const response = await axios.get(url);
    const claims = response.data.claims || [];

    if (claims.length === 0) {
      return { status: "UNVERIFIED", source: null, rating: null };
    }

    const topClaim = claims[0].claimReview[0];
    const rating = topClaim.textualRating.toLowerCase();
    let status = "UNVERIFIED";

    if (rating.includes("true")) {
      status = "VERIFIED_TRUE";
    } else if (rating.includes("false")) {
      status = "VERIFIED_FALSE";
    }

    return {
      status,
      source: topClaim.publisher.name,
      rating: topClaim.textualRating
    };
  } catch (err) {
    console.error("Fact Check API error:", err.message);
    return { status: "UNVERIFIED", source: null, rating: null };
  }
};


    // Loop through claim reviews and choose the most confident one
    let bestClaim = null;

    for (const claim of claims) {
      if (claim.claimReview && claim.claimReview.length > 0) {
        for (const review of claim.claimReview) {
          if (!bestClaim || review.textualRating.toLowerCase().includes("true")) {
            bestClaim = review;
          }
        }
      }
    }

    if (!bestClaim) {
      return { status: "UNVERIFIED", source: null, rating: null };
    }

    const textualRating = bestClaim.textualRating.toLowerCase();
let status = "UNVERIFIED"; // default

if (textualRating.includes("true")) {
  status = "VERIFIED_TRUE";
} else if (textualRating.includes("false") || textualRating.includes("pants on fire")) {
  status = "VERIFIED_FALSE";
} else {
  status = "UNVERIFIED";
}

return {
  status,
  source: bestClaim.publisher.name,
  rating: bestClaim.textualRating
};


//   } catch (err) {
//     console.error("Fact Check API error:", err.message);
//     return { status: "UNVERIFIED", source: null, rating: null };
//   }
// };
