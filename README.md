# 🦜 ParrotJS

Frontend development made easy.

## What is ParrotJS?

ParrotJS is a *"cache"* server that will remember your frontend app requests and respond to them with the same way your backend would.

Suppose we have the following communication flow:
```text

[Frontend] <=> [Backend]
        HTTP API

```

If we add ParrotJS to the mix we would now have the following flow:

```text
                        HTTP API
[Frontend] <=> [ParrotJS] <=> [Backend]
        HTTP API (cache)

```

ParrotJS will pretend to be your Backend by responding with the same headers and body for each type of your requests. If your backend is down/unreachable/offline you can keep working because ParrotJS will still *parrot* the same responses it's keeping in cache.

## Motivation

If you're a Frontend developer, like me. You've sureley had to deal with some kind of backend API. The biggest hurdle is usually to run that backend API or call it remotley. This is where usually things become less *"standard"* and you find youself in one of those situations :
- Run the backend locally in your machine and call it locally
- Call a remote backend in a staging server for example
- Call the live server (yes, some teams do that for some reason)
- Run a Docker container with the backend
- Etc...
In all these cases, you find yourself at the mercy of the backend. If it's running locally, your machine is dying with so many resources reserved for the backend app.
If on the other hand you're calling a remote API. It takes a network issue or a codebase update to break or slow down your work.
Another major issue is the API returned data not being consistent with your current task (new data added, data structure changes etc).
And finally, how all of this makes things hard to debug and test quickly your work.

## What ParrotJS can do for you?

ParrotJS is firstly a debug tool. Its main purpose is to be as transparent of a tool as possible. Something you don't really think about only when you need something **specific**.

When you start ParrotJS the first time, it will just repeat whatever your backend server does. Hence the name "Parrot". Every request and response is kept in cache and ParrotJS will build its own version of cache for you. If your frontend tries to request the same resource (and with some criterias you can learn about down below), ParrotJS will take over and return that response without hitting the backend.

Now let's suppose you need to change the server's response to test something. If your request was cached by ParrotJS. You will be able to change that response just by changing the corresponding JSON file containing the request body and headers.

### How it works

First you'll configure your Parrot. Second you'll point your frontend to Parrot. Finally you'll use your frontend app as usual and keep an eye on the cache folder.

1. Head to a folder for example `~/workspace/parrot-my-cool-app`, this will be your cache server for your backend. Parrot will make sure to keep your cache neatly organized in that folder.
2. Run the command `npx parrot init`, the CLI will ask you few questions to initialize a `config.parrot.ts`. You can run `npx parrot init -y` to generate a sample file and change its content with your favorite text editor if you hate pesky CLIs.
3. Once `config.parrot.ts` generated, simply run `npx parrot run` and we're done with our favorite birb.
4. Head to your frontend dev app and point your base URL to Parrot's address and port (defaults to `localhost:1120`)
5. Start your frontend dev app and navigate through it to make API calls. The more the better.
6. Note how Parrot is creating a `requests.json` file and subfolders with `*_body.json` and `*_headers.json` files.

Now let's understand how you can use all this at your advantage. Let's say that you have a simple `GET /user/ID_0029`:
- Under the folder `~workspace/parrot-my-cool-app/cache/` you'll notice a `requests.json`. It contains a stringified JSON array of all your intercepted requests. In this case you'll find an entry like the following:

```json
[
    {
        "method": "GET",
        "url": "/api/v1/user",
        "body": {},
        "code": 200,
        "headers": "cache/user/ID_0029_headers.json",
        "response": "cache/user/ID_0029_body.json"
    }
]
```
- Each request will be indexed in the `requests.json` file
- Each request will point to a different `*_headers.json` and `*_body.json`
  - Headers will contain the response headers of your API, useful if for example you're using the headers to send important frontend data
  - Body contains the API's response body this makes it easy to change/edit

That's it! You can even add files on the fly or edit those JSONs and call Parrot again, it will just respond with the files contents.

## Why not just mock in the frontend?

In a perfect world, I would mock all my API endpoints and go by my day. But if you've worked in any business context, you know how impossible this task can be. From one side, you have a backend that evolves with a separate team. And from another, the project manager asking you to ship your work ASAP.

Parrot relives you from mocking your APIs and just keeps a copy of your expected API responses. What's better is that you can even change the responses to test your code and how the UI will react to those changes without having to change anything in your frontend code.

## What about privacy?

ParrotJS runs (and should always run) in your local environnement to keep all your requests and responses safe. Everything is saved in plain JSON files you can read, change and delete. No data is collected about you, your work, or anything. This is also why ParrotJS is FREE and OpenSource.

## Current limitations/planned improvements

- [ ] Corporate proxy is hit or miss (Needs more testing, works for me at work)
- [ ] Compare request content and privelige responses with content rather than without
- [ ] Handles only JSON responses
- [ ] Error catching
- [ ] Parse and call OpenAPI files?
- [ ] Smart error catching (for example if `/user/ID_0029` is cached, respond with the same data for `/user/ID_0030` and increment relevant items)
- [ ] Multiple API base URLs?
- [ ] Interactive-mode CLI for API handling? (useful?)
- [ ] WS and WSS protocol?
- [ ] GraphQL support?
- [ ] Proxy any kind of file based on mimetype?
- [ ] Add stats? (ttfb with target server, diff, cache?)
- [ ] Add timestamps and random guids for requests
- [ ] Add log files

## Contribute

This project is an idea I want to share with the world to make developement easier for all of us. If you have a suggestion/idea, I will be very happy to communicate with you and improve this small piece of software.