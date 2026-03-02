# EngineFinder.cmake - Locates the O3DE engine installation
# Set O3DE_ENGINE_DIR to your engine path, or let it auto-detect

if(NOT O3DE_ENGINE_DIR)
    # Try environment variable
    if(DEFINED ENV{O3DE_ENGINE_DIR})
        set(O3DE_ENGINE_DIR $ENV{O3DE_ENGINE_DIR})
    else()
        # Check the o3de manifest for registered engines
        set(_manifest_path "$ENV{HOME}/.o3de/o3de_manifest.json")
        if(EXISTS "${_manifest_path}")
            file(READ "${_manifest_path}" _manifest_json)
            string(JSON _engine_path ERROR_VARIABLE _err GET "${_manifest_json}" "engines_path" "o3de-sdk")
            if(NOT _err AND EXISTS "${_engine_path}/CMakeLists.txt")
                set(O3DE_ENGINE_DIR "${_engine_path}")
            endif()
        endif()

        # Fallback to default search paths
        if(NOT O3DE_ENGINE_DIR)
            if(WIN32)
                set(_search_paths
                    "C:/O3DE"
                    "$ENV{USERPROFILE}/O3DE/Engine"
                )
            else()
                # Search versioned install paths (newest first)
                file(GLOB _versioned_paths "/opt/O3DE/*")
                list(SORT _versioned_paths ORDER DESCENDING)
                set(_search_paths
                    ${_versioned_paths}
                    "$ENV{HOME}/O3DE/Engine"
                    "$ENV{HOME}/o3de"
                    "/opt/o3de"
                )
            endif()

            foreach(_path ${_search_paths})
                if(EXISTS "${_path}/CMakeLists.txt")
                    set(O3DE_ENGINE_DIR "${_path}")
                    break()
                endif()
            endforeach()
        endif()
    endif()
endif()

if(O3DE_ENGINE_DIR)
    list(APPEND CMAKE_MODULE_PATH "${O3DE_ENGINE_DIR}/cmake")
    list(APPEND CMAKE_PREFIX_PATH "${O3DE_ENGINE_DIR}")
    message(STATUS "O3DE Engine found at: ${O3DE_ENGINE_DIR}")
else()
    message(STATUS "O3DE Engine not found. Set O3DE_ENGINE_DIR or install O3DE.")
    message(STATUS "This project scaffolding can be built once O3DE is available.")
endif()
