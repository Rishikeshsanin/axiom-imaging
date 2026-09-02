cmake_minimum_required(VERSION 3.20)
project(axiom_device_engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(axiom-device-engine src/main.cpp)
target_include_directories(axiom-device-engine PRIVATE include)
target_compile_options(axiom-device-engine PRIVATE -Wall -Wextra -Wpedantic)

include(CTest)
if(BUILD_TESTING)
  add_executable(device-engine-tests tests/device_tests.cpp)
  target_include_directories(device-engine-tests PRIVATE include)
  target_compile_options(device-engine-tests PRIVATE -Wall -Wextra -Wpedantic)
  add_test(NAME device-engine-tests COMMAND device-engine-tests)
endif()
