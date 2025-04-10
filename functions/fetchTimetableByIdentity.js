const axios = require("axios");
const ACADEMIC_START = "2024-09-16";
const ACADEMIC_END = "2025-05-11";


exports.fetchTimetableByIdentity = async (req, res) => {
  const {
    identity,
    categoryTypeIdentity,
    startDate = ACADEMIC_START,
    endDate = ACADEMIC_END,
  } = req.body;


  if (!identity || !categoryTypeIdentity || !startDate || !endDate) {
    return res.status(400).json({error: "Missing required fields."});
  }

  try {
    const baseUrl =
      "https://scientia-eu-v4-api-d4-01.azurewebsites.net/api/Public/" +
       "CategoryTypes/Categories/Events/Filter/" +
       "50a55ae1-1c87-4dea-bb73-c9e67941e1fd";

    const fetchUrl =
      `${baseUrl}?startRange=${startDate}T00:00:00.000Z&` +
      "endRange=" +
      endDate +
      "T23:59:59.999Z";

    const payload = {
      CategoryTypesWithIdentities: [
        {
          CategoryTypeIdentity: categoryTypeIdentity,
          CategoryIdentities: [identity],
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

    const response = await axios.post(fetchUrl, payload);

    const results =
      response.data &&
      response.data.CategoryEvents &&
      response.data.CategoryEvents.length > 0 &&
      response.data.CategoryEvents[0].Results ?
        response.data.CategoryEvents[0].Results :
        [];

    const events = results.map((lesson) => ({
      title: lesson.Description || lesson.Name,
      start: {
        dateTime: lesson.StartDateTime,
      },
      end: {
        dateTime: lesson.EndDateTime,
      },
      location: lesson.Location,
      type: "academic",
    }));

    return res.status(200).json({events});
  } catch (err) {
    console.error("Timetable fetch error:", err.message);
    return res.status(500).json({error: "Failed to fetch timetable."});
  }
};
