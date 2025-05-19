
const helpers = {};

helpers.clx = (...classes) => {
  return classes.join(" ");
}

helpers.errorPrompt = (errorPrompt, highlighedtInput, setErrorPrompt, setHighlighedtInput) => {
  if(setErrorPrompt !== null) {
    setErrorPrompt(errorPrompt);
  };
  if(setHighlighedtInput !== null) {
    setHighlighedtInput(highlighedtInput);
  } 
  setTimeout(() => {
    if(setErrorPrompt !== null) {
      setErrorPrompt("");
    }
    if(setHighlighedtInput !== null) {
      setHighlighedtInput("")
    } 
  }, 2000)
}

helpers.isValidEmail = (email) => {
  if (
    email.length === 0 ||
    email.split("@").length < 2 ||
    email.split(".").length < 2
  ){
    return false;
  }else{
    return true;
  }
}

helpers.estimateBiocharStats = (pincharBags, pelletcharBags, billingPlan) => {
  let stats = {};
  stats.weightPinchar = Math.round(pincharBags * 10 * 0.33)/10;
  stats.weightPelletchar = Math.round(pelletcharBags * 10 * 0.33)/10;
  stats.weightTotal = stats.weightPinchar + stats.weightPelletchar;
  stats.volumePinchar = pincharBags * 2;
  stats.volumePelletchar = pelletcharBags * 0.8;
  stats.volumeTotal = stats.volumePinchar + stats.volumePelletchar
  stats.pricePinchar = pincharBags * 80;
  stats.pricePelletchar = pelletcharBags * 260;
  stats.priceTotal = stats.pricePinchar + stats.pricePelletchar;
  let discount = 0;
  switch(billingPlan){
    case "monthly":
      break;
    case "quarterly":
      discount = stats.priceTotal * 0.10;
    case "yearly":
      discount = stats.priceTotal * 0.20;
    default: 
      break;
  }
  stats.priceDiscounted = stats.priceTotal - discount;
  return stats;
} 

helpers.getBookDetails = (book) => ({
  title: book.title,
  author: book.author_name?.[0] || "Unknown",
  blurb: book.blurb || "No blurb found.",
  cover: book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
    : null,
});

export default helpers;
