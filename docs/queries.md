Creating a file with all_paths with all the file paths in project, run this command in root
``` bash 
find . \( -name "node_modules" -o -name ".git" -o -name "dist" \) -prune -o -print > all_paths.txt
```