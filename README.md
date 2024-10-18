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

ParrotJS will pretend to be your Backend by responding with the same headers and body for each type of your requests. If your backend is down/unreachable/offline you can keep working because ParrotJS will still respond with the responses it's keeping in cache.

## Problematic

If you're a Frontend developer like me, you've sureley had to deal with some kind of backend API. The biggest hurdle is usually to run that backend API or call it remotley. This is where usually things become less *"standard"* and you find youself in one of those situations :
- Run the backend locally in your machine and call it locally
- Call a remote backend in a staging server for example
- Call the live server (yes, some teams do that for some reason)
- Run a Docker container with the backend
- Etc...
In all these cases, you find yourself at the mercy of the backend. If it's running locally, your machine is dying with so many resources reserved for the backend app.
If in the other hand you're calling a remote API. It takes a network issue or a codebase update to break or slow down your work.
Another major issue is the API returned data not being consistent with your current task (new data added, data structure changes etc).
And finally, how all of this makes things hard to debug and test quickly your work.

## What ParrotJS can do for you?

The idea behind ParrotJS is to have a transparent tool. Something you don't really think about only when you need something **specific**.

When you start ParrotJS the first time, it will just repeat whatever your backend server does. Hence the name "Parrot". Every request and response is kept in cache and ParrotJS will build its own version of cache for you. If your frontend tries to request the same resource (and with some criterias you can learn about down below), ParrotJS will take over and return that response without hitting the backend.

Now let's suppose you need to change the server's response to test something. If your request was cached by ParrotJS. You will be able to change that response just by changing the corresponding JSON file containing the request body and headers.

## Why not just mock in the frontend?

This is a legitimate question. I usually mock when I can. But when I'm dealing with work tasks and time is precious, I'd rather have a server almost like the backend to be sure I'm testing my app as expected than deal with mocking data and potentially committing it (I've been guilty of this many times).

## What about privacy?

ParrotJS runs (and should always run) in your local environnement to keep all your requests and responses safe. Everything is saved in plain JSON files you can read, change and delete. No data is collected about you, your work, your data or anything. This is also why ParrotJS is FREE and OpenSource.

## Current limitations

[ ] Corporate proxy is hit or miss