# Obsidian Reference Timetables

A plugin I made to track the timeline of tickets and some aggregate data for [Obsidian](https://obsidian.md).

## Why

I had two use cases I wanted to code a plugin for:

- I am running a campaign of 5e D&D and track a lot of data through an Obsidian vault. Specifically, I write diary-style session logs and link characters in them, and also have quest logs with session links in them. In both cases, I wanted to see the "timeline" of when my players were on what quests, or have seen which NPCs.
- At work, I take daily notes in an Obsidian vault and link tickets I work on that day (so I remember what I've done by the next day's Scrum). I want to be able to see some "timeline" data on those as well.

## What

Using custom code blocks (code `reftables`), you can have auto-generated tables that calculate number of links (front/back/both) between two sets of files. 
As part of the code block, you can write lines of the form `key: value` to control the generation. The following keys are available:

- **time_axis_path:** The folder/path prefix of files that represent the "timeline".
- **inquire_axis_path:** The folder/path prefix of files you want details on.
- **collect_links:** Your options are "front" (links from time to inquiry), "back" (links from inquiry to time) or "both".
- **include_first:** Whether the generated table should have a column linking the first time file in which each inquiry file was found.
- **include_last:** Whether the generated table should have a column linking the last time file in which each inquiry file was found.

## Examples

TODO add screenshots here

## Todos

Things I'd like to do to improve on the plugin:

- [ ] Add sort options for both axes (current is only natural alphanumeric sort on the file's full path)
- [ ] Add more aggregates (number of links, number of linked time files)
- [ ] Add an option to generate ONLY aggregates
- [ ] Add color to the table entries/improve style?
- [ ] Implement any suggestions!

Specifically for sort orders, sort orders I've thought of, all of them up or down:
- Full path
- Basename
- Each aggregate