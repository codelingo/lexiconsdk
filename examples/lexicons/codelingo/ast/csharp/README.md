## Setup
AST lexicons must be built on Linux containers. This means all the binaries referenced in this README can only be run on Linux.

All of the commands in this setup assumes that the working directory is at the root of this repo, ie. `lexiconsdk`.


1. Run `./examples/lexicons/codelingo/ast/csharp/setup.sh`
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

Note: csharp test has not been implemented yet, but you are welcome to write new csharp lexicon tests.