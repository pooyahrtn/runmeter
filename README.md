# Runmeter

![screenshot](https://github.com/pooyahrtn/runmeter/blob/main/screenshots/example.png)

The performance testing tool allows you to compare the performance of two or more scripts, such as curl commands, by running them in concurrent sessions. It measures various performance metrics, providing real-time visual feedback on the progress and detailed results of the performance tests.

## Features

- Concurrent Session Testing: Run multiple instances of scripts simultaneously.
- Performance Metrics: Detailed statistics including percentiles, median, average, and standard deviation.
- Real-time Monitoring: Visualize the progress and performance metrics in real-time.
- Customizable Scenarios: Define different scenarios and scripts to be tested.

## Installation

```
npm install -g runmeter
```

## Configuration

## How to use

Define a `runmeter.toml` configuration file to specify your testing scenarios, warmup sessions, duration, and concurrency settings. Below is an example configuration:

```toml
warmups = 10
duration = '10s'
max_concurrent_sessions = 4

[scenarios.facebook]
script = '''
curl https://www.facebook.com
'''

[scenarios.yahoo]
script = '''
curl https://www.yahoo.com
'''
```

- warmups: Number of warmup sessions to run before the actual test.
- duration: Duration for which the test should run (e.g., '10s' for 10 seconds).
- max_concurrent_sessions: Maximum number of concurrent sessions to run.
- scenarios: Define each scenario with a unique name and the script to be executed.

```toml
warmups = 10
duration = '10s'
max_concurrent_sessions = 4

[scenarios.facebook]
script = '''
curl https://www.facebook.com
'''

[scenarios.yahoo]
script = '''
curl https://www.yahoo.com
'''
```

## Usage

Once you have your runmeter.toml file configured, you can start the performance tests by running:

```sh
runmeter
```

This will execute the defined scripts, provide real-time visual feedback, and output detailed performance metrics for analysis.
