#include <cmath>
#include <vector>
#include <numeric>
#include <algorithm>

extern "C" float calculate_stability(const int* scores, int length) {
    if (length <= 1) return 0.0f;

    // Convert C array to vector
    std::vector<int> data(scores, scores + length);

    // Mean
    float mean = std::accumulate(data.begin(), data.end(), 0.0f) / length;

    //Standard Deviation
    float variance = 0.0f;
    for (int score : data) {
        variance += std::pow(score - mean, 2);
    }
    variance /= length;
    float stddev = std::sqrt(variance);

    // Average change between consecutive entries
    float total_change = 0.0f;
    for (int i = 1; i < length; ++i) {
        total_change += std::abs(data[i] - data[i - 1]);
    }
    float avg_change = total_change / (length - 1);

    // Combine and normalize (weighted sum)
    float raw_score = (stddev * 10.0f) + (avg_change * 10.0f);
    float capped_score = std::min(raw_score, 100.0f);  

    return capped_score;
}
