## Setup
AST lexicons must be built on Linux containers. This means all the binaries referenced in this README can only be run on Linux.

All of the commands in this setup assume that the working directory is at the root of this repo, ie. `lexiconsdk`.


1. Run `./examples/lexicons/codelingo/ast/php/setup.sh`

    Note: this script requires root permissions to create empty dirs at `/resource`, `/server` and `/testdata` which are required for the AST server.

2. Open a new terminal and run `./bin/ast-server`
    - It should echo something like:
        ```sh
        2017-08-25T15:22:54.447+1200	INFO	server/server.go:40	GRPC listening on 9999 ...

        2017-08-25T15:22:54.447+1200	INFO	server/server.go:44	HTTP listening on 8888 ...
        ```
    - This process can be terminated with `CTL + C`.
3. Run `./bin/test-client 127.0.0.1 check-parser`
    - It should echo something like:
        ```sh
        2017/08/28 11:19:40 Success! Parsed 41 nodes without error.
        ```
    - This is the simplest way to check the parser is outputting correct node data and isn't erroring.
4. Restart the ast-server:
    - In the server terminal, press `CTL + C` to exit the server.
    - Run `./bin/ast-server` to start it again.
    - It is only necessary to restart to server when changing from "run-tests" to "check-parser" or vice versa.
5. Run `./bin/test-client 127.0.0.1 run-tests`
    - It should echo something like:
      ```sh
      2017/08/25 17:30:39 Passed tests:
      2017/08/25 17:30:39     1: "Two basic files"
      2017/08/25 17:30:39     2: "Basic changed file"
      2017/08/25 17:30:39 Success! All tests passed.
      ```
    - This runs a couple of tests run for the PHP lexicon which can be seen in [tests.json](./testdata/tests.json)
    - The `run-tests` command is more complex than `check-parser` since it requires tests to be written for the lexicon, which you are welcome to do.
6. Run `./examples/lexicons/codelingo/ast/php/teardown.sh` to clean up.
