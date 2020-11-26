//Source: CS171, HW8
class NameConverter {
    constructor() {
        this.states = [
            ['Alabama', 'AL'],
            ['Alaska', 'AK'],
            ['American Samoa', 'AS'],
            ['Arizona', 'AZ'],
            ['Arkansas', 'AR'],
            ['Armed Forces Americas', 'AA'],
            ['Armed Forces Europe', 'AE'],
            ['Armed Forces Pacific', 'AP'],
            ['California', 'CA'],
            ['Colorado', 'CO'],
            ['Connecticut', 'CT'],
            ['Delaware', 'DE'],
            ['District of Columbia', 'DC'],
            ['Florida', 'FL'],
            ['Georgia', 'GA'],
            ['Guam', 'GU'],
            ['Hawaii', 'HI'],
            ['Idaho', 'ID'],
            ['Illinois', 'IL'],
            ['Indiana', 'IN'],
            ['Iowa', 'IA'],
            ['Kansas', 'KS'],
            ['Kentucky', 'KY'],
            ['Louisiana', 'LA'],
            ['Maine', 'ME'],
            ['Marshall Islands', 'MH'],
            ['Maryland', 'MD'],
            ['Massachusetts', 'MA'],
            ['Michigan', 'MI'],
            ['Minnesota', 'MN'],
            ['Mississippi', 'MS'],
            ['Missouri', 'MO'],
            ['Montana', 'MT'],
            ['Nebraska', 'NE'],
            ['Nevada', 'NV'],
            ['New Hampshire', 'NH'],
            ['New Jersey', 'NJ'],
            ['New Mexico', 'NM'],
            ['New York', 'NY'],
            ['North Carolina', 'NC'],
            ['North Dakota', 'ND'],
            ['Northern Mariana Islands', 'NP'],
            ['Ohio', 'OH'],
            ['Oklahoma', 'OK'],
            ['Oregon', 'OR'],
            ['Pennsylvania', 'PA'],
            ['Puerto Rico', 'PR'],
            ['Rhode Island', 'RI'],
            ['South Carolina', 'SC'],
            ['South Dakota', 'SD'],
            ['Tennessee', 'TN'],
            ['Texas', 'TX'],
            ['US Virgin Islands', 'VI'],
            ['Utah', 'UT'],
            ['Vermont', 'VT'],
            ['Virginia', 'VA'],
            ['Washington', 'WA'],
            ['West Virginia', 'WV'],
            ['Wisconsin', 'WI'],
            ['Wyoming', 'WY'],
        ]
    }

    getAbbreviation(input){
        let that = this
        let output = '';
        that.states.forEach( state => {
            if (state[0] === input){
                output = state[1]
            }})
        return output
    }

    getFullName(input){
        let that = this
        let output = '';
        that.states.forEach( state => {
            if (state[1] === input){
                output = state[0]
            }})
        return output
    }
}

let nameConverter = new NameConverter()

//Source: https://xaviergeerinck.com/post/coding/javascript/creating-a-bucketing-function/
class Bucket {
    constructor(bucketCount, rangeLow, rangeHigh) {
        this.bucketCount = bucketCount;
        this.rangeLow = rangeLow;
        this.rangeHigh = rangeHigh;
        this.stepSize = (Math.abs(rangeLow) + Math.abs(rangeHigh)) / bucketCount;

    }

    getBucketIdxForValue(val) {
        let idx = 0;

        // Find bucket based on bucket cutoff value
        while ((idx < this.bucketCount - 1) && val > this.rangeLow + this.stepSize * (idx + 1)) {
            idx++;
        }

        return idx;
    }

    // Sum the bucket index numbers for each dimension
    getBucketCategory(sport, val) {
        let idx = this.getBucketIdxForValue(val);
        if (bucketed[sport] == null) {
            bucketed[sport] = {total: idx, dimensions: [idx]};
        } else {
            bucketed[sport].total += idx;
            bucketed[sport].dimensions.push(idx)
        }
    }
}

