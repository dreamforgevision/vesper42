import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  MenuItem, 
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MovieIcon from '@mui/icons-material/Movie';
import TimelineIcon from '@mui/icons-material/Timeline';
import PeopleIcon from '@mui/icons-material/People';

const API_BASE = 'http://localhost:3001/api';

function GenerateScript() {
  const [premise, setPremise] = useState('');
  const [genre, setGenre] = useState('');
  const [targetLength, setTargetLength] = useState(110);
  const [genres, setGenres] = useState([]);
  const [examples, setExamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [outline, setOutline] = useState(null);
  const [error, setError] = useState(null);

  // Load genres on mount
  useEffect(() => {
    fetch(`${API_BASE}/genres`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGenres(data.genres);
        }
      })
      .catch(err => console.error('Error loading genres:', err));
  }, []);

  // Load examples when genre changes
  useEffect(() => {
    if (genre) {
      fetch(`${API_BASE}/examples/${genre}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setExamples(data.examples);
          }
        })
        .catch(err => console.error('Error loading examples:', err));
    }
  }, [genre]);

  const handleGenerate = async () => {
    if (!premise || !genre) {
      setError('Please provide both premise and genre');
      return;
    }

    setLoading(true);
    setError(null);
    setOutline(null);

    try {
      const response = await fetch(`${API_BASE}/generate-outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ premise, genre, targetLength })
      });

      const data = await response.json();

      if (data.success) {
        setOutline(data.outline);
      } else {
        setError(data.error || 'Failed to generate outline');
      }
    } catch (err) {
      setError('Error connecting to API: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderBeat = (beat) => (
    <Box key={beat.name} sx={{ mb: 3, pl: 2, borderLeft: '3px solid #1976d2' }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        📍 {beat.name} <Chip label={`Page ${beat.page}`} size="small" sx={{ ml: 1 }} />
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
        {beat.description}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#888' }}>
        ➤ {beat.example}
      </Typography>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AutoAwesomeIcon sx={{ fontSize: 40, mr: 2, color: '#1976d2' }} />
        <Typography variant="h4" component="h1">
          Generate Script Outline
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Create a winning script outline based on analysis of 100 successful films and TV shows.
      </Typography>

      {/* Input Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Premise"
              placeholder="e.g., A retired CIA agent must rescue his daughter from human traffickers"
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              multiline
              rows={2}
              helperText="Describe your story in one sentence"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              helperText="Select the primary genre"
            >
              {genres.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Target Length (pages)"
              value={targetLength}
              onChange={(e) => setTargetLength(parseInt(e.target.value))}
              helperText="Typical: 90-120 pages"
              inputProps={{ min: 60, max: 180 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleGenerate}
              disabled={loading || !premise || !genre}
              startIcon={loading ? <CircularProgress size={20} /> : <MovieIcon />}
            >
              {loading ? 'Generating...' : 'Generate Outline'}
            </Button>
          </Grid>
        </Grid>

        {/* Examples */}
        {examples.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Similar successful {genre} scripts:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {examples.slice(0, 5).map((ex) => (
                <Chip
                  key={ex.title}
                  label={`${ex.title} (${ex.imdb_rating})`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {outline && (
        <Box>
          {/* Prediction */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#f0f7ff' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary">
                      {Math.round(outline.prediction.probability * 100)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Success Probability
                    </Typography>
                    <Chip
                      label={outline.prediction.confidence.toUpperCase()}
                      color={
                        outline.prediction.confidence === 'high' ? 'success' :
                        outline.prediction.confidence === 'medium' ? 'warning' : 'default'
                      }
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={9}>
                <Typography variant="h6" gutterBottom>
                  <TimelineIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Analysis
                </Typography>
                <Typography variant="body2" paragraph>
                  {outline.prediction.reasoning}
                </Typography>
                {outline.prediction.comparables && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Similar successful films:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {outline.prediction.comparables.map((c) => (
                        <Chip
                          key={c.title}
                          label={`${c.title} (${c.rating})`}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* Structure Overview */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              <MovieIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Structure Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Total Pages
                </Typography>
                <Typography variant="h5">
                  {outline.structure.totalPages}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Act 1
                </Typography>
                <Typography variant="h5">
                  1-{outline.structure.act1End}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Act 2
                </Typography>
                <Typography variant="h5">
                  {outline.structure.act1End + 1}-{outline.structure.act2bEnd}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Act 3
                </Typography>
                <Typography variant="h5">
                  {outline.structure.act2bEnd + 1}-{outline.structure.act3End}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Recommendations */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              <PeopleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Recommendations
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(outline.recommendations).map(([key, value]) => (
                <Grid item xs={12} md={6} key={key}>
                  <Typography variant="body2" color="text.secondary">
                    {key.replace(/_/g, ' ').toUpperCase()}
                  </Typography>
                  <Typography variant="body1">
                    {value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Act Breakdowns */}
          <Box>
            {[outline.act1, outline.act2a, outline.act2b, outline.act3].map((act) => (
              <Accordion key={act.title} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    {act.title} <Chip label={act.pages} size="small" sx={{ ml: 1 }} />
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {act.beats.map(renderBeat)}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>
      )}
    </Container>
  );
}

export default GenerateScript;
