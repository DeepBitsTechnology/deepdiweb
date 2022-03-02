import { MAX_PROJECTS_CACHED } from "./config";

export const Projects: Map<string, ProjectInfo> = new Map();

export function add_project(key: string, info: ProjectInfo) {
    Projects.set(key, info);

    // only keep a maximum of MAX_PROJECTS_CACHED
    const projects_to_remove = Projects.size - MAX_PROJECTS_CACHED;
    if (projects_to_remove > 0) {
        const projects_names_to_remove = Array.from(Projects.keys()).slice(0, projects_to_remove);
        for (const name of projects_names_to_remove) {
            Projects.delete(name);
        }
    }
}

export function get_project(key: string): ProjectInfo | undefined {
    return Projects.get(key);
}

export function delete_project(key: string): boolean {
    return Projects.delete(key);
}

interface ProjectInfo {
    project_name: string;
    file_path: string; // the full path to the saved location

    raw: boolean; // whether or not we have raw bytes vs an actual file
    // only set if raw is true
    arch?: string;
    mode?: string;
}
