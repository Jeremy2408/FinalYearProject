const axios = require("axios");
const ACADEMIC_START = "2024-09-16";
const ACADEMIC_END = "2025-05-11";

exports.importTimetable = async (req, res) => {
  const {
    courseCode,
    startDate = ACADEMIC_START,
    endDate = ACADEMIC_END,
  } = req.body;

  if (!courseCode || !startDate || !endDate) {
    return res.status(400).json({error: "Missing required fields."});
  }

  try {
    // Fuzzy search
    const searchUrl =
      "https://scientia-eu-v4-api-d4-01.azurewebsites.net/api/Public/" +
      "CategoryTypes/241e4d36-93f2-4938-9e15-d4536fe3b2eb/" +
      "Categories/FilterWithCache/50a55ae1-1c87-4dea-bb73-c9e67941e1fd?" +
      "pageNumber=1&query=" +
      encodeURIComponent(courseCode);

    const searchRes = await axios.post(searchUrl);

    const results =
      searchRes.data &&
      searchRes.data.Results ?
        searchRes.data.Results :
        [];

    const exactMatch = results.find(
        (r) => r.Name.toLowerCase() === courseCode.toLowerCase(),
    );

    // If exact match NOT found, return fuzzy matches
    if (!exactMatch) {
      const suggestions = results.map((r) => ({
        name: r.Name,
        identity: r.Identity,
        categoryTypeIdentity: r.CategoryTypeIdentity,
      }));

      return res.status(404).json({
        error: "Course not found. Try selecting from the list below.",
        searchResults: suggestions,
      });
    }

    //  Fetch timetable for the matched course
    const fetchBase =
      "https://scientia-eu-v4-api-d4-01.azurewebsites.net/api/Public/" +
      "CategoryTypes/Categories/Events/Filter/" +
      "50a55ae1-1c87-4dea-bb73-c9e67941e1fd";

    const fetchUrl =
      `${fetchBase}?startRange=${startDate}T00:00:00.000Z&` +
      "endRange=" +
      endDate +
      "T23:59:59.999Z";

    const payload = {
      CategoryTypesWithIdentities: [
        {
          CategoryTypeIdentity: exactMatch.CategoryTypeIdentity,
          CategoryIdentities: [exactMatch.Identity],
        },
      ],
      FetchBookings: false,
      FetchPersonalEvents: false,
      PersonalIdentities: [],
      ViewOptions: {
        Days: [
          {DayOfWeek: 1},
          {DayOfWeek: 2},
          {DayOfWeek: 3},
          {DayOfWeek: 4},
          {DayOfWeek: 5},
        ],
      },
    };

    const lessonsRes = await axios.post(fetchUrl, payload);

    const apiResults =
      lessonsRes.data &&
      lessonsRes.data.CategoryEvents &&
      lessonsRes.data.CategoryEvents.length > 0 &&
      lessonsRes.data.CategoryEvents[0].Results ?
        lessonsRes.data.CategoryEvents[0].Results :
        [];

    const events = [];

    for (const lesson of apiResults) {
      events.push({
        title: lesson.Description || lesson.Name,
        start: {
          dateTime: lesson.StartDateTime,
        },
        end: {
          dateTime: lesson.EndDateTime,
        },
        location: lesson.Location,
        type: "academic",
      });
    }

    return res.status(200).json({events});
  } catch (err) {
    console.error("Error fetching timetable:", err.message);
    return res.status(500).json({error: "Internal server error."});
  }
};
