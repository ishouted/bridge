import axios from "axios";

export default async function checkLocation() {
  let isMainland = false;
  try {
    // isMainland = await axios.post("https://public.xxx.com");
  } catch (e) {
    //
  }
  return isMainland;
}