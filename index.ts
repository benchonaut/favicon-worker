async function callApi(url: string): Promise<Response> {
  try {
    return await fetch(url);
  } catch (e) {
    throw new Error(e.message);
  }
}

callApi("https://api.github.com/users/denoland")
  .then((response) => {
    return response.json();
  })
  .then(json => console.log(json));

callApi("https://deno.land/")
  .then((response) => {
    return response.text();
  })
  .then(text => console.log(text));

callApi("https://does.not.exist/")
  .catch(error => console.log(error));
